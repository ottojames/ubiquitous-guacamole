import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import PreviewPane from '@/components/publish/PreviewPane';

type UnknownRecord = Record<string, unknown>;

interface PublishConfirmContext extends UnknownRecord {
  isValid?: boolean;
  valid?: boolean;
  form?: PublishConfirmContext;
  state?: PublishConfirmContext;
  status?: PublishConfirmContext;
  values?: UnknownRecord;
  data?: UnknownRecord;
  meta?: UnknownRecord;
  selectedCouncil?: UnknownRecord | null;
  council?: UnknownRecord | null;
  previewHtml?: string | null;
  html?: string | null;
  noticeHtml?: string | null;
  previewText?: string | null;
  text?: string | null;
  summaryHtml?: string | null;
  authorityUrl?: string | null;
  authorityURL?: string | null;
  representationsUrl?: string | null;
  representationUrl?: string | null;
  validateAll?: () => boolean | Promise<boolean>;
  focusFirstError?: () => void;
}

export function safeParseURL(urlLike?: string): URL | null {
  if (!urlLike) return null;
  const trimmed = urlLike.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^([a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

export function hostnameOf(urlLike?: string): string | null {
  const parsed = safeParseURL(urlLike);
  if (!parsed) return null;
  return parsed.hostname.toLowerCase() || null;
}

export function buildCouncilDirectoryURL(input?: string): string | null {
  const parsed = safeParseURL(input);
  if (!parsed || !parsed.hostname) return null;
  return `https://${parsed.hostname}`;
}

function pickString(source: unknown, keys: string[]): string | null {
  if (!source) return null;
  if (typeof source === 'string') {
    const trimmed = source.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof source !== 'object') return null;
  for (const key of keys) {
    const value = (source as UnknownRecord)[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function searchString(candidates: unknown[], keys: string[]): string | null {
  for (const candidate of candidates) {
    const match = pickString(candidate, keys);
    if (match) return match;
  }
  return null;
}

function resolveBoolean(context: PublishConfirmContext | null, keys: (keyof PublishConfirmContext)[]): boolean | null {
  if (!context) return null;
  for (const key of keys) {
    const value = context[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  const nestedKeys: (keyof PublishConfirmContext)[] = ['form', 'state', 'status'];
  for (const nestedKey of nestedKeys) {
    const nested = context[nestedKey] as PublishConfirmContext | undefined;
    if (!nested) continue;
    const result = resolveBoolean(nested, keys);
    if (result !== null) return result;
  }
  return null;
}

function resolveFunction<T extends keyof PublishConfirmContext>(
  context: PublishConfirmContext | null,
  key: T
): PublishConfirmContext[T] | undefined {
  if (!context) return undefined;
  const fn = context[key];
  if (typeof fn === 'function') return fn;
  const nestedKeys: (keyof PublishConfirmContext)[] = ['form', 'state', 'status'];
  for (const nestedKey of nestedKeys) {
    const nested = context[nestedKey] as PublishConfirmContext | undefined;
    const nestedFn = resolveFunction(nested ?? null, key);
    if (nestedFn) return nestedFn;
  }
  return undefined;
}

type DomainHosts = {
  provided: string;
  directory: string;
};

export default function StepConfirm() {
  const navigate = useNavigate();
  const outletContext = useOutletContext<PublishConfirmContext | undefined>();
  const [overrideContext, setOverrideContext] = React.useState<PublishConfirmContext | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const submitAttempted = React.useRef(false);

  React.useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const handleTestContext = (event: Event) => {
      const custom = event as CustomEvent<PublishConfirmContext | null | undefined>;
      const payload = custom.detail;
      if (payload == null) {
        setOverrideContext(null);
        return;
      }
      setOverrideContext((prev) => ({ ...(prev ?? {}), ...payload }));
    };
    node.addEventListener('publish-confirm:test-context', handleTestContext as EventListener);
    return () => {
      node.removeEventListener('publish-confirm:test-context', handleTestContext as EventListener);
    };
  }, []);

  const context = React.useMemo<PublishConfirmContext | null>(() => {
    if (!outletContext && !overrideContext) return null;
    if (!outletContext) return overrideContext;
    if (!overrideContext) return outletContext;
    return {
      ...outletContext,
      ...overrideContext,
      form: (overrideContext.form ?? outletContext.form) as PublishConfirmContext | undefined,
      values: (overrideContext.values ?? outletContext.values) as UnknownRecord | undefined,
      data: (overrideContext.data ?? outletContext.data) as UnknownRecord | undefined,
      meta: (overrideContext.meta ?? outletContext.meta) as UnknownRecord | undefined,
      selectedCouncil: (overrideContext.selectedCouncil ?? outletContext.selectedCouncil) as UnknownRecord | null | undefined,
      council: (overrideContext.council ?? outletContext.council) as UnknownRecord | null | undefined,
    };
  }, [outletContext, overrideContext]);

  const isFormValid = React.useMemo(() => {
    const resolved = resolveBoolean(context, ['isValid', 'valid']);
    return resolved ?? false;
  }, [context]);

  const validateAll = React.useMemo(() => {
    const fn = resolveFunction(context, 'validateAll');
    return typeof fn === 'function' ? (fn as (() => boolean | Promise<boolean>)) : undefined;
  }, [context]);

  const focusFirstError = React.useMemo(() => {
    const fn = resolveFunction(context, 'focusFirstError');
    return typeof fn === 'function' ? (fn as () => void) : undefined;
  }, [context]);

  const valuesCandidates = React.useMemo(() => {
    const candidates: unknown[] = [];
    if (context) candidates.push(context);
    if (context?.values) candidates.push(context.values);
    if (context?.form?.values) candidates.push(context.form.values);
    if (context?.data) candidates.push(context.data);
    if (context?.meta) candidates.push(context.meta);
    if (context?.state?.values) candidates.push(context.state.values);
    return candidates;
  }, [context]);

  const authorityUrl = React.useMemo(() => {
    return (
      searchString(valuesCandidates, [
        'authorityUrl',
        'authorityURL',
        'authority_url',
        'representationsUrl',
        'representationUrl',
        'portal',
        'portalUrl',
      ]) ||
      pickString(context, ['authorityUrl', 'authorityURL', 'representationsUrl', 'representationUrl'])
    );
  }, [context, valuesCandidates]);

  const councilSource = React.useMemo(() => {
    return (
      (context?.selectedCouncil as UnknownRecord | null | undefined) ??
      (context?.council as UnknownRecord | null | undefined) ??
      (context?.meta?.selectedCouncil as UnknownRecord | null | undefined) ??
      null
    );
  }, [context]);

  const councilDirectoryInput = React.useMemo(() => {
    return (
      searchString(
        [context, ...valuesCandidates, councilSource],
        [
          'councilDirectoryUrl',
          'councilDirectoryURL',
          'directoryUrl',
          'directoryURL',
          'directory',
          'licensingUrl',
          'portal',
          'portalUrl',
          'website',
          'url',
          'host',
          'hostname',
          'repsUrl',
        ]
      ) || null
    );
  }, [context, councilSource, valuesCandidates]);

  const previewHtml = React.useMemo(() => {
    return (
      searchString([context, context?.meta, context?.state], [
        'previewHtml',
        'html',
        'noticeHtml',
        'summaryHtml',
        'renderedHtml',
      ]) || null
    );
  }, [context]);

  const previewText = React.useMemo(() => {
    return (
      searchString([context, context?.meta, context?.values], [
        'previewText',
        'text',
        'noticeText',
        'finalText',
        'plainText',
      ]) || null
    );
  }, [context]);

  const councilName = React.useMemo(() => {
    return (
      searchString([councilSource, ...valuesCandidates], [
        'councilName',
        'displayName',
        'name',
        'authorityName',
      ]) || null
    );
  }, [councilSource, valuesCandidates]);

  const councilDirectoryURL = React.useMemo(() => buildCouncilDirectoryURL(councilDirectoryInput ?? undefined), [councilDirectoryInput]);
  const authorityHost = hostnameOf(authorityUrl ?? undefined);
  const directoryHost = hostnameOf(councilDirectoryURL ?? undefined);
  const domainMismatch = Boolean(authorityHost && directoryHost && authorityHost !== directoryHost);
  const domainHosts: DomainHosts | null = domainMismatch && authorityHost && directoryHost ? {
    provided: authorityHost,
    directory: directoryHost,
  } : null;

  const handleSubmit = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isFormValid) {
        event.preventDefault();
        submitAttempted.current = true;
        try {
          const result = validateAll?.();
          const resolved = typeof result === 'boolean' ? result : await result;
          if (!resolved) {
            focusFirstError?.();
          }
        } catch {
          focusFirstError?.();
        }
        return;
      }
      navigate('/next/publish/pay');
    },
    [focusFirstError, isFormValid, navigate, validateAll]
  );

  const submitDisabled = !isFormValid;

  return (
    <div ref={rootRef} data-confirm-root className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Step 3 · Confirm your notice</p>
        <h1 className="text-2xl font-semibold text-foreground">Confirm your Notice</h1>
        <p className="text-sm text-muted-foreground">
          Review the generated notice and council contact details before publishing.
        </p>
      </div>

      <PreviewPane
        html={previewHtml ?? undefined}
        text={previewText ?? undefined}
        authorityURL={authorityUrl ?? null}
        councilDirectoryURL={councilDirectoryURL}
        domainMismatch={domainMismatch}
        domainMismatchHosts={domainHosts}
      />

      <div className="space-y-2 rounded-xl border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        {authorityUrl && (
          <div>
            <span className="font-medium text-foreground">Authority URL:</span>{' '}
            <span data-testid="confirm-authority-url">{authorityUrl}</span>
          </div>
        )}
        {councilDirectoryURL && (
          <div>
            <span className="font-medium text-foreground">Council directory:</span>{' '}
            <span data-testid="confirm-directory-url">{councilDirectoryURL}</span>
            {councilName && <span className="sr-only"> for {councilName}</span>}
          </div>
        )}
        {domainHosts && (
          <div>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
              role="status"
              aria-live="polite"
              data-testid="confirm-domain-warning"
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Authority URL doesn’t match the council directory domain.
              <span className="sr-only"> Provided host {domainHosts.provided}; directory host {domainHosts.directory}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
          data-testid="confirm-submit"
          onClick={handleSubmit}
          disabled={submitDisabled}
          aria-disabled={submitDisabled}
        >
          Continue to payment
        </button>
      </div>
    </div>
  );
}
