import { extractUKPostcode } from '@/lib/ukPostcode';

export type AddressSuggestion = {
  id: string;
  label: string;
  postcode?: string;
};

export type AddressDetail = {
  label: string;
  line1?: string;
  line2?: string;
  town?: string;
  county?: string;
  postcode?: string;
};

function apiKey(): string {
  return ((import.meta.env as Record<string, unknown>).VITE_GETADDRESS_API_KEY as string | undefined) ?? '';
}

function ensureKey(): string {
  const key = apiKey();
  if (!key) throw new Error('Address lookup not configured (API key).');
  return key;
}

function autoUrl(query: string) {
  const key = ensureKey();
  return `/api/getaddress/autocomplete/${encodeURIComponent(query)}?api-key=${encodeURIComponent(key)}&all=true&top=10`;
}

function getUrl(id: string) {
  const key = ensureKey();
  return `/api/getaddress/get/${encodeURIComponent(id)}?api-key=${encodeURIComponent(key)}`;
}

function responseError(status: number): never {
  if (status === 401 || status === 403) {
    throw new Error('Address lookup not configured (API key).');
  }
  if (status === 429) {
    throw new Error('Address lookup rate-limited. Try again shortly.');
  }
  throw new Error(`Address service error (${status}).`);
}

export function mapAutocomplete(json: any): AddressSuggestion[] {
  const suggestions = Array.isArray(json?.suggestions) ? (json.suggestions as any[]) : [];
  const mapped = suggestions
    .map((entry: any): AddressSuggestion | null => {
      if (!entry || typeof entry !== 'object') return null;
      const id = typeof entry.id === 'string' ? entry.id : null;
      const label = typeof entry.address === 'string' ? entry.address : null;
      if (!id || !label) return null;
      const postcode = typeof entry.postcode === 'string' ? entry.postcode : undefined;
      return { id, label, postcode };
    })
    .filter(Boolean) as AddressSuggestion[];

  if (mapped.length > 0) return mapped;

  const results = Array.isArray(json?.results) ? (json.results as any[]) : [];
  return results
    .map((entry: any): AddressSuggestion | null => {
      const dpa = entry?.DPA;
      if (!dpa || typeof dpa !== 'object') return null;
      const id = typeof dpa.UPRN === 'string' ? dpa.UPRN : typeof dpa.UPRN === 'number' ? String(dpa.UPRN) : null;
      const label = typeof dpa.ADDRESS === 'string' ? dpa.ADDRESS : null;
      if (!id || !label) return null;
      const postcode = typeof dpa.POSTCODE === 'string' ? dpa.POSTCODE : undefined;
      return { id, label, postcode };
    })
    .filter(Boolean) as AddressSuggestion[];
}

export function mapDetail(json: any): AddressDetail {
  let record: any = Array.isArray(json?.result) ? json.result[0] : json?.result;

  if (!record && json?.address) record = json.address;

  if (!record && Array.isArray(json?.addresses) && json.addresses.length) {
    const label = String(json.addresses[0]);
    const postcode = extractUKPostcode(label);
    return { label, postcode };
  }

  if (!record) {
    const raw = typeof json === 'string' ? json : JSON.stringify(json ?? {});
    return { label: '', postcode: extractUKPostcode(raw) };
  }

  const lines: string[] = [];
  if (record?.line_1) lines.push(String(record.line_1).trim());
  if (record?.line_2) lines.push(String(record.line_2).trim());
  if (record?.line_3) lines.push(String(record.line_3).trim());

  const locality = [record?.town_or_city, record?.county]
    .map((value: unknown) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(', ');

  const baseLabel = [lines.join(', '), locality, record?.postcode]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(', ')
    .replace(/,\s*,/g, ',');

  const postcode = typeof record?.postcode === 'string' && record.postcode.trim()
    ? record.postcode.trim()
    : extractUKPostcode(baseLabel);

  return {
    label: baseLabel,
    line1: typeof record?.line_1 === 'string' ? record.line_1.trim() : '',
    line2: typeof record?.line_2 === 'string' ? record.line_2.trim() : '',
    town: typeof record?.town_or_city === 'string' ? record.town_or_city.trim() : '',
    county: typeof record?.county === 'string' ? record.county.trim() : '',
    postcode,
  };
}

export function makeAddressSearcher() {
  let ctrl: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function search(rawQuery: string): Promise<AddressSuggestion[]> {
    const query = rawQuery.trim();
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (ctrl) {
      ctrl.abort();
      ctrl = null;
    }

    if (!query || query.length < 3) {
      return Promise.resolve([]);
    }

    ensureKey();
    ctrl = new AbortController();

    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          const res = await fetch(autoUrl(query), { signal: ctrl?.signal });
          if (!res.ok) {
            responseError(res.status);
          }
          const json = await res.json();
          resolve(mapAutocomplete(json));
        } catch (error: any) {
          if (error?.name === 'AbortError') return;
          reject(error instanceof Error ? error : new Error('Address lookup unavailable.'));
        } finally {
          ctrl = null;
          timer = undefined;
        }
      }, 300);
    });
  };
}

export async function fetchAddressDetail(id: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(getUrl(id), { signal });
  if (!res.ok) {
    responseError(res.status);
  }
  return res.json();
}
