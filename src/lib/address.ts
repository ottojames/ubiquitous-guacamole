import { listAuthorityPacks } from './authorityPacks';
import { lookupCouncilByPostcode } from './councilLookup';

const REQUEST_TIMEOUT_MS = 7000;
const RATE_LIMIT_DELAY_MS = 1000;

export type Address = {
  uprn?: string;
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  country?: 'UK';
};

export type AddressSuggestion = Address & {
  id: string;
  label: string;
  source?: 'primary' | 'fallback';
};

export type AddressProviderStatus = number | 'skipped' | 'error' | 'aborted' | null;

export type AddressProviderMeta = {
  url: string | null;
  status: AddressProviderStatus;
  count: number;
};

export type AddressQueryMeta = {
  query: string;
  primary: AddressProviderMeta;
  fallback: AddressProviderMeta;
};

export type AddressQueryOptions = {
  signal?: AbortSignal;
  onMeta?: (meta: AddressQueryMeta) => void;
  errors?: AddressQueryError[];
  onRateLimitRetry?: () => void;
};

export type AddressQueryResult = {
  suggestions: AddressSuggestion[];
  meta: AddressQueryMeta;
  error?: AddressQueryError | null;
};

export type AddressQueryError = {
  status?: number | 'timeout';
  reason: 'config' | 'credentials' | 'rate-limit' | 'network' | 'timeout' | 'unknown';
  provider?: 'primary' | 'fallback';
  retriable: boolean;
  message?: string;
};

const rawEnv = (import.meta.env ?? {}) as Record<string, unknown>;

function envValue(...keys: string[]): string {
  for (const key of keys) {
    const raw = rawEnv[key];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  return '';
}

const RAW_API_URL = envValue(
  'ADDRESS_API_URL',
  'VITE_ADDRESS_API_URL',
  'VITE_ADDR_API_URL',
  'VITE_GETADDRESS_URL'
);
const RAW_API_KEY = envValue(
  'ADDRESS_API_KEY',
  'VITE_ADDRESS_API_KEY',
  'VITE_ADDR_API_KEY',
  'VITE_GETADDRESS_KEY'
);
const RAW_FALLBACK_URL = envValue(
  'ADDRESS_FALLBACK_URL',
  'VITE_ADDRESS_FALLBACK_URL',
  'VITE_ADDR_FALLBACK_URL',
  'VITE_GETADDRESS_FALLBACK_URL'
);

let loggedConfigOnce = false;

function debugLog(...args: any[]) {
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    console.debug(...args);
  }
}

type PrimaryEndpoint = {
  url: string;
  headers?: Record<string, string>;
  provider: 'generic' | 'getaddress';
};

function buildPrimaryEndpoint(config: ApiConfig, query: string): PrimaryEndpoint | null {
  const baseInput = (config.url ?? '').trim();
  if (!baseInput || !config.key) return null;

  const base = baseInput.replace(/\/+$/, '');

  if (/getaddress\.io/i.test(base)) {
    // getAddress.io autocomplete supports fuzzy search. `/find` requires full postcodes.
    let endpoint = base;
    if (/\/find$/i.test(endpoint)) {
      endpoint = endpoint.replace(/\/find$/i, '/autocomplete');
    } else if (!/\/autocomplete$/i.test(endpoint)) {
      endpoint = `${endpoint}/autocomplete`;
    }
    const url = `${endpoint}/${encodeURIComponent(query)}?api-key=${encodeURIComponent(config.key)}&all=true&top=10`;
    return { url, provider: 'getaddress' };
  }

  // Generic provider: assume bearer token + suggest endpoint or {query} placeholder.
  let url = base;
  if (url.includes('{query}')) {
    url = url.replace('{query}', encodeURIComponent(query));
  } else {
    url = `${url}/suggest?q=${encodeURIComponent(query)}`;
  }

  return {
    url,
    headers: { Authorization: `Bearer ${config.key}` },
    provider: 'generic',
  };
}

type AddressApiOverride = {
  url?: string;
  key?: string;
  fallbackUrl?: string;
};

declare global {
  interface Window {
    __addrApiConfig?: AddressApiOverride;
  }
}

type ApiConfig = {
  url: string;
  key: string;
  fallbackUrl: string;
};

function resolveApiConfig(): ApiConfig {
  const override: AddressApiOverride | undefined =
    typeof window !== 'undefined' ? window.__addrApiConfig : undefined;

  const url = String(override?.url ?? RAW_API_URL ?? '').trim().replace(/\/+$/, '');
  const key = String(override?.key ?? RAW_API_KEY ?? '').trim();
  const fallbackUrl = String(override?.fallbackUrl ?? RAW_FALLBACK_URL ?? '').trim();

  return { url, key, fallbackUrl };
}

const loggedMessages = new Set<string>();

function logOnce(key: string, level: 'error' | 'warn', ...args: unknown[]) {
  if (loggedMessages.has(key)) return;
  loggedMessages.add(key);
  if (level === 'warn') {
    console.warn(...args);
  } else {
    console.error(...args);
  }
}

export const MIN_QUERY_LENGTH = 3;

export function canQuery(query: string) {
  return (query?.trim().length ?? 0) >= MIN_QUERY_LENGTH;
}
const FB_URL = RAW_FALLBACK_URL;

type FallbackOpts = { limit?: number; country?: string };

function fallbackBase(): string {
  const { fallbackUrl } = resolveApiConfig();
  const base = (fallbackUrl || FB_URL || '').trim();
  return base ? base.replace(/\/+$/, '') : '';
}

function fbUrl(q: string, opts: FallbackOpts = {}, baseOverride?: string) {
  const base = baseOverride ? baseOverride.trim().replace(/\/+$/, '') : fallbackBase();
  if (!base) return '';
  const limit = String(opts.limit ?? 30);
  const country = (opts.country ?? 'gb').toLowerCase();
  const u = new URL(`${base}/search`);
  u.searchParams.set('q', q);
  u.searchParams.set('format', 'jsonv2');
  u.searchParams.set('addressdetails', '1');
  u.searchParams.set('countrycodes', country);
  u.searchParams.set('dedupe', '1');
  u.searchParams.set('limit', limit);
  u.searchParams.set('accept-language', 'en-GB');
  return u.toString();
}

function tokenize(q: string): string[] {
  return q.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/).filter(Boolean);
}

function score(label: string, tokens: string[]): number {
  const l = label.toLowerCase();
  let s = 0;
  for (const t of tokens) {
    if (l.includes(t)) s += 1;
  }
  if (/^\d+\b/.test(label)) s += 0.5;
  return s;
}

export function envReady(): boolean {
  const { url, key } = resolveApiConfig();
  return Boolean(url && key);
}

function norm(value: string): string {
  return (value ?? '').trim();
}

function toPC(value: string): string {
  return value.toUpperCase().replace(/\s+/g, '');
}

function extractPostcode(value: string): string | null {
  const match = value.toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/);
  return match ? toPC(match[0]) : null;
}

function buildFallbackEndpoint(base: string, query: string): string {
  if (!base) return '';
  if (base.includes('{query}')) {
    return base.replace('{query}', encodeURIComponent(query));
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}q=${encodeURIComponent(query)}`;
}

function shapePrimary(entries: any[]): AddressSuggestion[] {
  const mapped: AddressSuggestion[] = [];
  for (const entry of entries ?? []) {
    const suggestion = safeToSuggestion(entry);
    if (suggestion) {
      mapped.push({ ...suggestion, source: 'primary' });
    }
  }
  return mapped;
}

function shapeFallback(items: any[]): AddressSuggestion[] {
  const shaped: AddressSuggestion[] = [];

  for (const entry of items ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    const address = entry?.address ?? {};
    const rawLine1 =
      (address?.house_number && address?.road)
        ? `${address.house_number} ${address.road}`
        : entry?.name ?? address?.road ?? (typeof entry?.display_name === 'string' ? entry.display_name.split(',')[0] : '');
    const line1 = typeof rawLine1 === 'string' ? rawLine1.trim() : '';
    const town = String(
      address?.town ??
      address?.city ??
      address?.village ??
      address?.suburb ??
      address?.hamlet ??
      ''
    ).trim();
    const rawPostcode = address?.postcode ?? entry?.postcode ?? '';
    const postcode = rawPostcode ? toPC(String(rawPostcode)) : '';
    const label = (typeof entry?.display_name === 'string' && entry.display_name.trim())
      ? entry.display_name.trim()
      : [line1, postcode, town].filter(Boolean).join(', ');

    if (!label) continue;

    shaped.push({
      id: String(entry?.place_id ?? cryptoRandomId()),
      uprn: entry?.uprn ? String(entry.uprn) : undefined,
      line1: line1 || label.split(',')[0]?.trim() || '',
      line2: '',
      town,
      postcode,
      country: 'UK',
      label,
      source: 'fallback',
    });
  }

  return shaped;
}

function extractCandidates(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const buckets = [
    payload.results,
    payload.suggestions,
    payload.items,
    payload.features,
    payload.addresses,
    payload.data,
  ];
  for (const bucket of buckets) {
    if (Array.isArray(bucket)) return bucket;
  }
  if (payload.result && Array.isArray(payload.result)) return payload.result;
  if (payload.result && typeof payload.result === 'object') return [payload.result];
  return [];
}

function normaliseKeyPart(value: string | undefined): string {
  return value ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

function suggestionKeys(suggestion: AddressSuggestion): string[] {
  const keys: string[] = [];
  const uprn = suggestion.uprn?.trim();
  if (uprn) {
    keys.push(uprn.toLowerCase());
  }

  const postcodeKey = suggestion.postcode ? toPC(suggestion.postcode).toLowerCase() : '';
  const line1Key = normaliseKeyPart(suggestion.line1);
  const townKey = normaliseKeyPart(suggestion.town);

  if (postcodeKey || line1Key || townKey) {
    keys.push(`${postcodeKey}|${line1Key}|${townKey}`);
  }

  const labelKey = normaliseKeyPart(suggestion.label);
  if (!keys.length && labelKey) {
    keys.push(labelKey);
  }

  return keys.filter(Boolean);
}

function dedupeSuggestions(list: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const deduped: AddressSuggestion[] = [];

  for (const item of list) {
    const keys = suggestionKeys(item);
    const alreadySeen = keys.some((key) => seen.has(key));
    if (alreadySeen) continue;

    deduped.push(item);
    for (const key of keys) {
      seen.add(key);
    }
  }

  return deduped;
}

type ProviderDebugRecord = {
  url: string | null;
  status: number | 'skipped' | 'error' | 'aborted' | null;
  count: number;
  labels: string[];
};

class ProviderResponseError extends Error {
  provider: 'primary' | 'fallback';
  status: number;

  constructor(provider: 'primary' | 'fallback', status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ProviderResponseError';
    this.provider = provider;
    this.status = status;
  }
}

function toProviderMeta(record: ProviderDebugRecord): AddressProviderMeta {
  return {
    url: record.url ?? null,
    status: record.status ?? null,
    count: record.count,
  };
}

function buildQueryMeta(query: string, info: Record<'primary' | 'fallback', ProviderDebugRecord>): AddressQueryMeta {
  return {
    query,
    primary: toProviderMeta(info.primary),
    fallback: toProviderMeta(info.fallback),
  };
}

function isLikelyCorsError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof TypeError) {
    const msg = typeof error.message === 'string' ? error.message : '';
    return /failed to fetch|network/i.test(msg);
  }
  const message = typeof (error as any)?.message === 'string' ? (error as any).message : '';
  return /cors/i.test(message);
}

type ScopedAbort = {
  signal: AbortSignal;
  cleanup: () => void;
  timeoutHit: () => boolean;
};

function createScopedSignal(parent?: AbortSignal, timeoutMs = REQUEST_TIMEOUT_MS): ScopedAbort {
  const controller = new AbortController();
  let timedOut = false;

  const timer = timeoutMs > 0
    ? setTimeout(() => {
        timedOut = true;
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, timeoutMs)
    : null;

  const onAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (parent) {
    if (parent.aborted) {
      controller.abort();
    } else {
      parent.addEventListener('abort', onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      if (parent) parent.removeEventListener('abort', onAbort);
    },
    timeoutHit: () => timedOut,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function pushError(target: AddressQueryError[] | undefined, error: AddressQueryError) {
  if (!target) return;
  target.push(error);
}

function normaliseSearchQuery(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  const wholePostcode = normalisePostcode(collapsed);
  if (wholePostcode) return wholePostcode;
  const parts = collapsed.split(' ');
  return parts
    .map((part) => {
      const postcode = normalisePostcode(part);
      if (postcode) return postcode;
      return part;
    })
    .join(' ');
}

type RequestSuggestionsParams = {
  provider: 'primary' | 'fallback';
  url: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  debugInfo: ProviderDebugRecord;
  errors?: AddressQueryError[];
  debugActive: boolean;
  shape: (payload: any) => AddressSuggestion[];
  allowRetryOn429?: boolean;
  onRateLimitRetry?: () => void;
};

async function requestSuggestions(params: RequestSuggestionsParams): Promise<AddressSuggestion[]> {
  const {
    provider,
    url,
    headers,
    signal,
    debugInfo,
    errors,
    debugActive,
    shape,
    allowRetryOn429 = true,
    onRateLimitRetry,
  } = params;

  if (!url) return [];

  const fetchWithRetry = async (attempt: number): Promise<AddressSuggestion[]> => {
    const scoped = createScopedSignal(signal);
    try {
      debugLog('[address] requestSuggestions fetch', {
        provider,
        url,
        attempt,
        retryAllowed: allowRetryOn429,
      });
      const response = await fetch(url, {
        headers,
        signal: scoped.signal,
      });
      debugInfo.status = response.status;

      if (response.status === 429) {
        if (attempt < 1 && allowRetryOn429) {
          onRateLimitRetry?.();
          await delay(RATE_LIMIT_DELAY_MS);
          return fetchWithRetry(attempt + 1);
        }
        pushError(errors, {
          status: 429,
          reason: 'rate-limit',
          provider,
          retriable: false,
        });
        return [];
      }

      if (!response.ok) {
        throw new ProviderResponseError(provider, response.status);
      }

      const payload = await response.json().catch(() => null);
      const shaped = shape(payload ?? null);
      debugInfo.count = shaped.length;
      debugInfo.labels = shaped.slice(0, 3).map((item) => item.label);
      return shaped;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        if (scoped.timeoutHit()) {
          debugInfo.status = 'error';
          pushError(errors, {
            status: 'timeout',
            reason: 'timeout',
            provider,
            retriable: true,
          });
        } else {
          debugInfo.status = 'aborted';
        }
        return [];
      }

      const status =
        error instanceof ProviderResponseError
          ? error.status
          : typeof error?.status === 'number'
            ? error.status
            : 'error';

      debugInfo.status = status;
      debugInfo.count = 0;
      debugInfo.labels = [];

      if (status === 401 || status === 403) {
        pushError(errors, {
          status,
          reason: 'credentials',
          provider,
          retriable: false,
        });
        logOnce(`address-credentials-${provider}`, 'warn', `[address] ${provider} provider credentials invalid (${status}).`);
      } else if (status === 429) {
        pushError(errors, {
          status,
          reason: 'rate-limit',
          provider,
          retriable: true,
        });
      } else if (scoped.timeoutHit()) {
        pushError(errors, {
          status: 'timeout',
          reason: 'timeout',
          provider,
          retriable: true,
        });
      } else if (isLikelyCorsError(error)) {
        if (provider === 'fallback') {
          logOnce(
            'address-fallback-cors',
            'warn',
            '[address] fallback blocked by browser CORS. Point VITE_ADDR_FALLBACK_URL to a proxy endpoint (e.g. /api/geo) that forwards to Nominatim.'
          );
        }
        pushError(errors, {
          reason: 'network',
          provider,
          retriable: true,
          message: 'CORS blocked',
        });
      } else {
        pushError(errors, {
          reason: 'network',
          provider,
          retriable: true,
          message: error instanceof Error ? error.message : undefined,
        });
      }

      if (debugActive) {
        console.warn(`[address] ${provider} provider failed`, error);
      }
      return [];
    } finally {
      scoped.cleanup();
    }
  };

  return fetchWithRetry(0);
}

async function builtInAddressFallback(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  if (typeof fetch === 'undefined') return [];
  try {
    const url = `/api/addresses?q=${encodeURIComponent(query)}`;
    debugLog('[address] builtInAddressFallback fetching', { url, query });
    const response = await fetch(url, { signal });
    debugLog('[address] builtInAddressFallback response', { status: response.status, ok: response.ok });
    if (!response.ok) {
      debugLog('[address] builtInAddressFallback failed', { status: response.status });
      return [];
    }
    const payload = await response.json().catch(() => null);
    debugLog('[address] builtInAddressFallback payload', { hasPayload: !!payload, payload: JSON.stringify(payload).substring(0, 200) });
    const items = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
    debugLog('[address] builtInAddressFallback items', { count: items.length });
    const suggestions = (items as any[])
      .map((item, index): AddressSuggestion | null => {
        if (!item || typeof item !== 'object') return null;

        // Backend returns { id, label, postcode? } format
        if (item.label && typeof item.label === 'string') {
          const parts = item.label.split(',').map((p: string) => p.trim());
          // Use postcode from item if available, otherwise extract from label
          const postcodeFromLabel = parts.find((p: string) => normalisePostcode(p));
          const postcode = item.postcode || postcodeFromLabel;
          const line1 = parts[0] || '';
          const town = parts[parts.length - 1] || '';

          if (!line1) return null;

          return {
            id: String(item.id ?? `builtin-${index}`),
            uprn: item.uprn ? String(item.uprn) : undefined,
            line1,
            line2: undefined,
            town,
            postcode: normalisePostcode(postcode || '') || '',
            country: 'UK',
            label: item.label,
            source: 'fallback',
          };
        }

        // Fallback to old format if label doesn't exist
        const line1 = normaliseLine(item.line1);
        const town = normaliseLine(item.town);
        const postcode = normalisePostcode(item.postcode) ?? '';
        if (!line1 || !town || !postcode) return null;
        const line2 = normaliseOptional(item.line2);
        const labelParts = [line1, line2, town, postcode].filter(Boolean);
        return {
          id: String(item.uprn ?? item.id ?? `${line1}-${town}-${index}`),
          uprn: item.uprn ? String(item.uprn) : undefined,
          line1,
          line2,
          town,
          postcode,
          country: 'UK',
          label: labelParts.join(', '),
          source: 'fallback',
        };
      })
      .filter(Boolean) as AddressSuggestion[];
    debugLog('[address] builtInAddressFallback returning', { count: suggestions.length });
    return suggestions;
  } catch (error: any) {
    debugLog('[address] builtInAddressFallback error', { error: error?.message, name: error?.name });
    if (error?.name === 'AbortError') return [];
    return [];
  }
}

export async function fetchAddressSuggestions(
  query: string,
  options: AddressQueryOptions = {}
): Promise<AddressSuggestion[]> {
  const trimmed = norm(query);
  const { signal, onMeta, errors } = options;

  debugLog('[address] fetchAddressSuggestions called', {
    query: trimmed,
    length: trimmed.length,
  });

  if (!canQuery(trimmed)) {
    debugLog('[address] fetchAddressSuggestions skipped (query too short)', {
      query: trimmed,
      length: trimmed.length,
      minLength: MIN_QUERY_LENGTH,
    });
    const emptyInfo: Record<'primary' | 'fallback', ProviderDebugRecord> = {
      primary: { url: null, status: 'skipped', count: 0, labels: [] },
      fallback: { url: null, status: 'skipped', count: 0, labels: [] },
    };
    onMeta?.(buildQueryMeta(trimmed, emptyInfo));
    return [];
  }

  const normalizedQuery = normaliseSearchQuery(trimmed);
  const config = resolveApiConfig();

  if (!loggedConfigOnce) {
    debugLog('[address] resolved provider config', {
      hasPrimaryUrl: Boolean(config.url),
      hasPrimaryKey: Boolean(config.key),
      hasFallbackUrl: Boolean(config.fallbackUrl || FB_URL),
    });
    loggedConfigOnce = true;
  }
  const debugActive = debugEnabled();

  const primaryEndpoint = buildPrimaryEndpoint(config, normalizedQuery);
  debugLog('[address] primary endpoint', primaryEndpoint);
  const fallbackBase = (config.fallbackUrl || FB_URL || '').trim().replace(/\/+$/, '');
  const fallbackEndpoint = fallbackBase
    ? fbUrl(normalizedQuery, { limit: 30 }, fallbackBase)
    : '';
  if (fallbackEndpoint) {
    debugLog('[address] fallback endpoint', fallbackEndpoint);
  }

  const debugInfo: Record<'primary' | 'fallback', ProviderDebugRecord> = {
    primary: { url: primaryEndpoint?.url ?? null, status: primaryEndpoint ? null : 'skipped', count: 0, labels: [] },
    fallback: { url: fallbackEndpoint || null, status: fallbackEndpoint ? null : 'skipped', count: 0, labels: [] },
  };

  if (!primaryEndpoint) {
    debugLog('[address] fetchAddressSuggestions missing primary config', {
      hasUrl: Boolean(config.url),
      hasKey: Boolean(config.key),
      query: normalizedQuery,
    });
    debugInfo.primary.status = 'skipped';
    debugInfo.fallback.status = 'skipped';

    debugLog('[address] calling builtInAddressFallback', { query: normalizedQuery });
    const builtin = await builtInAddressFallback(normalizedQuery, signal);
    debugLog('[address] builtInAddressFallback returned', { count: builtin.length });
    if (builtin.length) {
      debugLog('[address] fetchAddressSuggestions using built-in fallback', {
        query: normalizedQuery,
        count: builtin.length,
      });
      onMeta?.(buildQueryMeta(normalizedQuery, debugInfo));
      return builtin.slice(0, 10);
    }

    pushError(errors, {
      reason: 'config',
      retriable: false,
      message: 'Address search not configured.',
    });
    onMeta?.(buildQueryMeta(normalizedQuery, debugInfo));
    return [];
  }

  const primaryPromise = primaryEndpoint
    ? requestSuggestions({
        provider: 'primary',
        url: primaryEndpoint.url,
        headers: primaryEndpoint.headers,
        signal,
        debugInfo: debugInfo.primary,
        errors,
        debugActive,
        shape: (payload) => {
          const entries = Array.isArray(payload) ? payload : extractCandidates(payload);
          return shapePrimary(entries);
        },
        onRateLimitRetry: options.onRateLimitRetry,
      })
    : Promise.resolve<AddressSuggestion[]>([]);

  const fallbackPromise = fallbackEndpoint
    ? requestSuggestions({
        provider: 'fallback',
        url: fallbackEndpoint,
        signal,
        debugInfo: debugInfo.fallback,
        errors,
        debugActive,
        shape: (payload) => {
          const entries = Array.isArray(payload) ? payload : extractCandidates(payload);
          return shapeFallback(entries);
        },
        onRateLimitRetry: options.onRateLimitRetry,
      })
    : Promise.resolve<AddressSuggestion[]>([]);

  const [primaryResult, fallbackResult] = await Promise.allSettled([primaryPromise, fallbackPromise]);

  if (primaryResult.status === 'rejected' && (debugInfo.primary.status === null || debugInfo.primary.status === undefined)) {
    debugInfo.primary.status = 'error';
  }
  if (fallbackResult.status === 'rejected' && (debugInfo.fallback.status === null || debugInfo.fallback.status === undefined)) {
    debugInfo.fallback.status = 'error';
  }

  const primarySuggestions = primaryResult.status === 'fulfilled' ? primaryResult.value : [];
  const fallbackSuggestions = fallbackResult.status === 'fulfilled' ? fallbackResult.value : [];

  const merged = dedupeSuggestions([...primarySuggestions, ...fallbackSuggestions]);

  const tokens = tokenize(normalizedQuery);
  merged.sort((a, b) => {
    const sa = score(a.label, tokens);
    const sb = score(b.label, tokens);
    return sb - sa || a.label.localeCompare(b.label);
  });

  let limited = merged.slice(0, 20);

  if (!limited.length) {
    const builtin = await builtInAddressFallback(normalizedQuery, signal);
    if (builtin.length) {
      debugLog('[address] fetchAddressSuggestions falling back to built-in dataset', {
        query: normalizedQuery,
        count: builtin.length,
      });
      limited = builtin.slice(0, 10);
      debugInfo.primary.status = debugInfo.primary.status ?? 'skipped';
      debugInfo.fallback.status = debugInfo.fallback.status ?? 'skipped';
    }
  }

  onMeta?.(buildQueryMeta(normalizedQuery, debugInfo));
  debugLog('[address] fetchAddressSuggestions completed', {
    query: normalizedQuery,
    count: limited.length,
  });
  return limited;
}

type QueryOptionsArg = {
  signal?: AbortSignal;
  onRateLimitRetry?: () => void;
};

export async function queryAddressAPI(
  query: string,
  signalOrOptions?: AbortSignal | QueryOptionsArg
): Promise<AddressQueryResult> {
  let signal: AbortSignal | undefined;
  let onRateLimitRetry: (() => void) | undefined;

  if (signalOrOptions && typeof signalOrOptions === 'object' && ('signal' in (signalOrOptions as any) || 'onRateLimitRetry' in (signalOrOptions as any))) {
    const opts = signalOrOptions as QueryOptionsArg;
    signal = opts.signal;
    onRateLimitRetry = opts.onRateLimitRetry;
  } else {
    signal = signalOrOptions as AbortSignal | undefined;
  }

  const errors: AddressQueryError[] = [];
  let capturedMeta: AddressQueryMeta | null = null;

  const suggestions = await fetchAddressSuggestions(query, {
    signal,
    errors,
    onRateLimitRetry,
    onMeta: (meta) => {
      capturedMeta = meta;
    },
  });

  if (!capturedMeta) {
    const fallbackInfo: Record<'primary' | 'fallback', ProviderDebugRecord> = {
      primary: { url: null, status: 'skipped', count: 0, labels: [] },
      fallback: { url: null, status: 'skipped', count: 0, labels: [] },
    };
    capturedMeta = buildQueryMeta(normaliseSearchQuery(norm(query)), fallbackInfo);
  }

  const error = errors.length > 0 ? errors[errors.length - 1] : null;

  return {
    suggestions,
    meta: capturedMeta,
    error,
  };
}

function debugEnabled(): boolean {
  try {
    const search = typeof location !== 'undefined' ? location.search ?? '' : '';
    if (!search) return false;
    if (search.includes('debug=address=1')) return true;
    const sp = new URLSearchParams(search);
    const debugParam = sp.get('debug');
    if (debugParam === 'address' || debugParam === 'address=1') return true;
    if (typeof debugParam === 'string' && debugParam.includes('address=1')) return true;
    return sp.get('debug:address') === '1';
  } catch {
    return false;
  }
}

export function addressDebugEnabled(): boolean {
  return debugEnabled();
}

export async function resolveToPostcodeOrNull(
  inputOrSuggestion: string | AddressSuggestion
): Promise<string | null> {
  const suggestion = typeof inputOrSuggestion === 'object' ? inputOrSuggestion : null;
  if (suggestion?.postcode) {
    return compressPostcode(suggestion.postcode);
  }

  // If we have a GetAddress suggestion with an ID, resolve it first
  if (suggestion?.id && !suggestion?.postcode) {
    try {
      const response = await fetch(`/api/address/resolve?id=${encodeURIComponent(suggestion.id)}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.result?.postcode) {
          return compressPostcode(data.result.postcode);
        }
      }
    } catch (error) {
      console.warn('Failed to resolve address:', error);
    }
  }

  const text = typeof inputOrSuggestion === 'string'
    ? inputOrSuggestion
    : suggestion?.label ?? [suggestion?.line1, suggestion?.town].filter(Boolean).join(', ');

  const direct = compressPostcode(text);
  if (direct) return direct;

  const config = resolveApiConfig();

  const tryPrimary = async () => {
    if (!config.url || !config.key) return null;
    const endpoint = `${config.url}/postcode?text=${encodeURIComponent(norm(text))}`;
    const headers = { Authorization: `Bearer ${config.key}` };
    return fetchPostcode(endpoint, headers);
  };

  const tryFallback = async () => {
    const base = config.fallbackUrl ? config.fallbackUrl.replace(/\/+$/, '') : `${config.url}/geocode`;
    const endpoint = buildFallbackEndpoint(base, text);
    const headers = config.fallbackUrl ? undefined : config.url && config.key ? { Authorization: `Bearer ${config.key}` } : undefined;
    return fetchPostcode(endpoint, headers);
  };

  const fromPrimary = await tryPrimary();
  if (fromPrimary) return fromPrimary;

  const fromFallback = await tryFallback();
  if (fromFallback) return fromFallback;

  return null;
}

async function fetchPostcode(endpoint: string, headers?: Record<string, string>): Promise<string | null> {
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const candidate = pickFirstPostcode(data);
    return candidate ? candidate.replace(/\s+/g, '') : null;
  } catch (error: any) {
    if (error?.name === 'AbortError') return null;
    logOnce(`postcode-error-${endpoint}`, 'warn', '[address] postcode resolve failed', error);
    return null;
  }
}

function pickFirstPostcode(payload: any): string | null {
  const queue: any[] = [payload];
  const visited = new Set<any>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current === 'number' || typeof current === 'boolean') continue;
    if (visited.has(current)) continue;

    if (typeof current === 'string') {
      const matched = normalisePostcode(current);
      if (matched) return matched;
      continue;
    }

    if (typeof current === 'object') {
      visited.add(current);
      const fields = [
        current.postcode,
        current.post_code,
        current.POSTCODE,
        current.Postcode,
        current.postalCode,
        current.postal_code,
      ];
      for (const field of fields) {
        const matched = normalisePostcode(field);
        if (matched) return matched;
      }

      const nested = [
        current.result,
        current.results,
        current.items,
        current.suggestions,
        current.features,
        current.addresses,
        current.data,
        current.list,
      ];
      for (const entry of nested) {
        if (Array.isArray(entry)) {
          queue.push(...entry);
        } else if (entry && typeof entry === 'object') {
          queue.push(entry);
        }
      }

      for (const value of Object.values(current)) {
        if (typeof value === 'string' || typeof value === 'object') {
          queue.push(value);
        }
      }
    }
  }

  return null;
}

function safeToSuggestion(it: any): AddressSuggestion | null {
  if (!it || typeof it !== 'object') return null;
  const id = String(it?.id ?? it?.uprn ?? cryptoRandomId());
  let line1 = normaliseLine(it?.line1 ?? it?.address_line_1 ?? it?.ADDRESS_LINE_1);
  const line2 = normaliseOptional(it?.line2 ?? it?.address_line_2 ?? it?.ADDRESS_LINE_2);
  let town = normaliseLine(it?.town ?? it?.post_town ?? it?.city);
  const postcode = normalisePostcode(it?.postcode ?? it?.post_code ?? it?.POSTCODE ?? it?.postal_code) ?? '';

  const explicitLabel =
    typeof it?.label === 'string'
      ? it.label
      : typeof it?.formatted === 'string'
        ? it.formatted
        : typeof it?.address === 'string'
          ? it.address
          : undefined;

  const label = explicitLabel?.trim() || buildLabel({ ...it, line1, line2, town, postcode });
  if (!label) return null;

  if (!line1) {
    line1 = label.split(',')[0]?.trim() || '';
  }

  if (!town) {
    town = it?.town ?? it?.post_town ?? it?.city ?? label.split(',').slice(-1)[0]?.trim() ?? '';
  }

  return {
    id,
    uprn: it?.uprn ? String(it.uprn) : undefined,
    line1,
    line2,
    town,
    postcode,
    country: 'UK',
    label,
  };
}

function buildLabel(it: any): string {
  if (typeof it?.label === 'string' && it.label.trim()) return it.label.trim();
  if (typeof it?.formatted === 'string' && it.formatted.trim()) return it.formatted.trim();
  if (typeof it?.address === 'string' && it.address.trim()) return it.address.trim();
  const bits = [
    it.line1 ?? it.address_line_1 ?? it.ADDRESS_LINE_1,
    it.line2 ?? it.address_line_2 ?? it.ADDRESS_LINE_2,
    it.town ?? it.post_town ?? it.city,
    normalisePostcode(it.postcode ?? it.post_code ?? it.POSTCODE ?? it.postal_code),
  ];
  return bits.filter(Boolean).join(', ');
}

function normaliseLine(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normaliseOptional(value: unknown): string | undefined {
  const line = normaliseLine(value);
  return line || undefined;
}

export function normalisePostcode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

export function compressPostcode(raw: unknown): string | null {
  const normalised = typeof raw === 'string' ? normalisePostcode(raw) : null;
  return normalised ? normalised.replace(/\s+/g, '') : null;
}

export function suggestionToAddress(suggestion: AddressSuggestion): Address {
  const parts = suggestion.label
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const directPostcode = normalisePostcode(suggestion.postcode);
  let postcode = directPostcode ?? '';
  if (!postcode) {
    for (const part of parts) {
      const candidate = normalisePostcode(part);
      if (candidate) {
        postcode = candidate;
        break;
      }
    }
  }

  const withoutPostcode = postcode
    ? parts.filter((part) => normalisePostcode(part) !== postcode)
    : parts.slice();

  const line1 = normaliseLine(suggestion.line1) || withoutPostcode.shift() || suggestion.label;
  const rawLine2 = normaliseOptional(suggestion.line2) ?? withoutPostcode.shift();
  const town = normaliseLine(suggestion.town) || withoutPostcode.pop() || '';
  const line2 = rawLine2 && rawLine2 !== line1 && rawLine2 !== town ? rawLine2 : undefined;

  return {
    uprn: suggestion.uprn?.trim() || undefined,
    line1,
    line2,
    town,
    postcode,
    country: 'UK',
  };
}

export type CouncilMatch = {
  id: string | null;
  name: string;
  email?: string;
  address?: string;
};

export function mapPostcodeToCouncil(postcode: string): CouncilMatch | null {
  const lookup = lookupCouncilByPostcode(postcode);
  if (!lookup) return null;
  const pack = listAuthorityPacks().find((entry) => entry.name === lookup.councilName);
  return {
    id: pack?.id ?? null,
    name: lookup.councilName,
    email: lookup.councilEmail || pack?.representation.email || undefined,
    address: lookup.councilAddress || pack?.representation.postal || undefined,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
