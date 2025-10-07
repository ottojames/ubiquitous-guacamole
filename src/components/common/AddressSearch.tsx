import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  MIN_QUERY_LENGTH,
  addressDebugEnabled,
  envReady,
  queryAddressAPI,
  suggestionToAddress,
  type Address,
  type AddressSuggestion,
  type AddressQueryMeta,
  type AddressQueryError,
  type AddressProviderStatus,
} from '@/lib/address';

export type AddressSelection = {
  suggestion: AddressSuggestion;
  address: Address;
  query: string;
};

type AddressSearchProps = {
  onSelected: (selection: AddressSelection) => void | Promise<void>;
  onFallback?: (query: string) => void | Promise<void>;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  debounceMs?: number;
  testIdPrefix?: string;
};

const DEFAULT_HINT = 'Start typing the premises postcode or address.';
const DEFAULT_DEBOUNCE = 320;

function normaliseQuery(input: string): string {
  return input.replace(/,+$/, '').replace(/\s+/g, ' ').trim();
}

export default function AddressSearch({
  onSelected,
  onFallback,
  placeholder = 'Search for the premises address',
  hint = DEFAULT_HINT,
  defaultValue = '',
  disabled,
  autoFocus,
  debounceMs = DEFAULT_DEBOUNCE,
  testIdPrefix = 'address-search',
}: AddressSearchProps) {
  const inputId = React.useId();
  const listboxId = `${inputId}-options`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const [value, setValue] = React.useState(defaultValue);
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [inlineInfo, setInlineInfo] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const envWarnedRef = React.useRef(false);
  const lastQueryRef = React.useRef('');
  const [lastQuery, setLastQuery] = React.useState('');
  const [debugMeta, setDebugMeta] = React.useState<AddressQueryMeta | null>(null);
  const [lastError, setLastError] = React.useState<AddressQueryError | null>(null);
  const inlineErrorRef = React.useRef<string | null>(null);
  const inlineInfoRef = React.useRef<string | null>(null);
  const suggestionsRef = React.useRef<AddressSuggestion[]>([]);

  React.useEffect(() => {
    inlineErrorRef.current = inlineError;
  }, [inlineError]);

  React.useEffect(() => {
    inlineInfoRef.current = inlineInfo;
  }, [inlineInfo]);

  React.useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const queryValue = React.useMemo(() => normaliseQuery(value), [value]);
  const showFallback = queryValue.length > 0;
  const fallbackIndex = suggestions.length;
  const totalOptions = suggestions.length + (showFallback ? 1 : 0);
  const activeOptionId = highlightedIndex >= 0
    ? highlightedIndex === fallbackIndex && showFallback
      ? `${listboxId}-fallback`
      : `${listboxId}-option-${highlightedIndex}`
    : undefined;

  const resetPending = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  React.useEffect(() => resetPending, [resetPending]);

  const formatProviderStatus = React.useCallback((status: AddressProviderStatus | null | undefined) => {
    if (typeof status === 'number') return String(status);
    if (!status) return '—';
    return status;
  }, []);

  const overlayEnabled = React.useMemo(() => {
    const windowFlag = typeof window !== 'undefined' && (window as any).__CN_DEBUG_ADDRESS__ === true;
    const devRuntime = Boolean((import.meta.env as Record<string, unknown> | undefined)?.DEV);

    if (!devRuntime && !windowFlag) return false;
    if (windowFlag) return true;
    if (addressDebugEnabled()) return true;

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === 'address') return true;
      } catch {
        // ignore
      }
    }

    return false;
  }, [value]);

  const fetchSuggestions = React.useCallback(
    async (query: string) => {
      resetPending();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setInlineInfo(null);
      setInlineError(null);

      const handleRateLimitRetry = () => {
        setInlineError(null);
        setInlineInfo('Rate limited—retrying…');
      };

      try {
        lastQueryRef.current = query;
        setLastQuery(query);
        const result = await queryAddressAPI(query, { signal: controller.signal, onRateLimitRetry: handleRateLimitRetry });
        if (controller.signal.aborted) return;

        setSuggestions(result.suggestions);
        setMenuOpen(true);
        setHighlightedIndex(result.suggestions.length > 0 ? 0 : -1);
        setDebugMeta(result.meta);
        setLastError(result.error ?? null);

        const error = result.error;

        if (error?.reason === 'config') {
          setInlineInfo(null);
          setInlineError('Address search not configured');
          return;
        }

        if (error?.reason === 'credentials') {
          setInlineInfo(null);
          setInlineError('Address service credentials invalid');
          return;
        }

        if (error?.reason === 'rate-limit') {
          setInlineInfo(null);
          setInlineError('Rate limited — try again');
          return;
        }

        if (error?.reason === 'network') {
          setInlineInfo(null);
          setInlineError('Address service unreachable');
          return;
        }

        if (error?.reason === 'timeout') {
          setInlineInfo(null);
          setInlineError('Address service unreachable');
          return;
        }

        if (error?.reason === 'unknown') {
          setInlineInfo(null);
          setInlineError('Address lookup unavailable. Try again.');
          return;
        }

        setInlineInfo(null);
        setInlineError(null);
      } catch (error: any) {
        if (controller.signal.aborted) return;
        console.warn('[address] suggestion fetch failed', error);
        setSuggestions([]);
        setMenuOpen(true);
        setHighlightedIndex(-1);
        setDebugMeta(null);
        const fallbackError: AddressQueryError = {
          reason: 'unknown',
          retriable: true,
          message: error instanceof Error ? error.message : undefined,
        };
        setLastError(fallbackError);
        setInlineInfo(null);
        setInlineError('Address lookup unavailable. Try again.');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      }
    },
    [resetPending]
  );

  React.useEffect(() => {
    const query = queryValue;
    resetPending();

    if (disabled) {
      setSuggestions([]);
      setMenuOpen(false);
      return;
    }

    if (!query) {
      setSuggestions([]);
      setMenuOpen(showFallback);
      setInlineError(null);
      setInlineInfo(null);
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setMenuOpen(true);
      return;
    }

    if (!envReady()) {
      if (!envWarnedRef.current) {
        console.warn('[address] environment missing ADDRESS_API_URL/KEY.');
        envWarnedRef.current = true;
      }
      setSuggestions([]);
      setMenuOpen(true);
      setInlineInfo(null);
      setInlineError('Address search not configured');
      setDebugMeta(null);
      setLastError({ reason: 'config', retriable: false });
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(query);
    }, Math.max(100, debounceMs));
  }, [debounceMs, disabled, fetchSuggestions, queryValue, resetPending, showFallback]);

  React.useEffect(() => {
    return () => resetPending();
  }, [resetPending]);

  const handleSelect = React.useCallback(
    (suggestion: AddressSuggestion) => {
      resetPending();
      const address = suggestionToAddress(suggestion);
      const payload: AddressSelection = {
        suggestion,
        address,
        query: queryValue || suggestion.label,
      };
      setValue(suggestion.label);
      setSuggestions([]);
      setMenuOpen(false);
      setHighlightedIndex(-1);
      setDebugMeta(null);
      setLastError(null);
      void Promise.resolve(onSelected(payload));
    },
    [onSelected, queryValue, resetPending]
  );

  const handleFallback = React.useCallback(() => {
    resetPending();
    setMenuOpen(false);
    setHighlightedIndex(-1);
    setDebugMeta(null);
    setLastError(null);
    if (queryValue && onFallback) {
      void Promise.resolve(onFallback(queryValue));
    }
  }, [onFallback, queryValue, resetPending]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (!totalOptions) return;
      event.preventDefault();
      setMenuOpen(true);
      setHighlightedIndex((prev) => {
        if (prev < 0) return 0;
        return (prev + 1) % totalOptions;
      });
      return;
    }
    if (event.key === 'ArrowUp') {
      if (!totalOptions) return;
      event.preventDefault();
      setMenuOpen(true);
      setHighlightedIndex((prev) => {
        if (prev < 0) return totalOptions - 1;
        return prev === 0 ? totalOptions - 1 : prev - 1;
      });
      return;
    }
    if (event.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        event.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        return;
      }
      if (showFallback && highlightedIndex === fallbackIndex) {
        event.preventDefault();
        handleFallback();
        return;
      }
      if (queryValue && onFallback) {
        event.preventDefault();
        handleFallback();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const showMenu = menuOpen && (isFocused || inlineError !== null || inlineInfo !== null || suggestions.length > 0);
  const showEmptyState =
    showMenu &&
    !loading &&
    !inlineError &&
    queryValue.length >= MIN_QUERY_LENGTH &&
    suggestions.length === 0;

  const helperText = inlineInfo ?? hint;

  return (
    <div className="relative z-50">
      <div className="relative">
        <label className="sr-only" htmlFor={inputId}>
          {placeholder}
        </label>
        <input
          id={inputId}
          type="text"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMenuOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setMenuOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            window.setTimeout(() => {
              if (!inlineErrorRef.current && !inlineInfoRef.current && suggestionsRef.current.length === 0) {
                setMenuOpen(false);
              }
            }, 120);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showMenu}
          aria-controls={showMenu ? listboxId : undefined}
          aria-activedescendant={showMenu ? activeOptionId : undefined}
          aria-describedby={[helperId, inlineError ? errorId : undefined]
            .filter(Boolean)
            .join(' ') || undefined}
          data-testid={`${testIdPrefix}-address-input`}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
        />
        {showMenu && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Address suggestions"
            data-testid={`${testIdPrefix}-suggest-menu`}
            className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 text-sm shadow-xl"
          >
            {loading && (
              <li className="flex items-center gap-2 px-3 py-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Searching…
              </li>
            )}
            {!loading &&
              suggestions.map((suggestion, index) => {
                const highlighted = index === highlightedIndex;
                return (
                  <li
                    key={`${suggestion.id}-${index}`}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={highlighted}
                    data-testid={`${testIdPrefix}-suggest-item`}
                    className={`cursor-pointer px-3 py-2 ${
                      highlighted ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      handleSelect(suggestion);
                    }}
                  >
                    {suggestion.label}
                  </li>
                );
              })}
            {showEmptyState && (
              <li className="px-3 py-2 text-slate-500">No suggestions</li>
            )}
            {showEmptyState && (
              <li className="px-3 pb-2 text-xs text-slate-400">
                Try a full postcode or "street + town".
              </li>
            )}
            {showFallback && (
              <li
                id={`${listboxId}-fallback`}
                role="option"
                aria-selected={highlightedIndex === fallbackIndex}
                data-testid={`${testIdPrefix}-suggest-fallback`}
                className={`cursor-pointer px-3 py-2 font-medium ${
                  highlightedIndex === fallbackIndex ? 'bg-blue-50 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
                }`}
                onMouseEnter={() => setHighlightedIndex(fallbackIndex)}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleFallback();
                }}
              >
                {`Search for "${queryValue}" → results`}
              </li>
            )}
          </ul>
        )}
      </div>
      <p id={helperId} className="mt-2 text-xs text-slate-500">
        {helperText}
      </p>
      {inlineError && (
        <div id={errorId} role="alert" className="mt-1 flex items-center gap-3 text-xs text-rose-600">
          <span>{inlineError}</span>
          {lastError && (lastError.reason === 'network' || lastError.reason === 'timeout') && lastQuery && !disabled && (
            <button
              type="button"
              className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              onClick={() => {
                if (disabled) return;
                const retryQuery = lastQueryRef.current || lastQuery;
                if (retryQuery) {
                  void fetchSuggestions(retryQuery);
                }
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {overlayEnabled && (
        <div className="fixed bottom-4 left-4 z-[80] w-64 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg">
          <div className="font-semibold text-slate-700">Address debug</div>
          <div className="mt-1 text-slate-600">query: {lastQuery || '—'}</div>
          <div className="text-slate-600">primary: {formatProviderStatus(debugMeta?.primary.status)}</div>
          <div className="text-slate-600">fallback: {formatProviderStatus(debugMeta?.fallback.status)}</div>
          <div className="text-slate-600">results: {suggestions.length}</div>
          {lastError && (
            <div className="text-amber-600">
              error: {lastError.reason}
              {lastError.status ? ` (${lastError.status})` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
