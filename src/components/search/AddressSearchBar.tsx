import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  canQuery,
  fetchAddressSuggestions,
  addressDebugEnabled,
  type AddressSuggestion,
} from '@/lib/address';

export type AddressSearchSubmitPayload = {
  query: string;
  suggestion?: AddressSuggestion;
};

type AddressSearchBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (payload: AddressSearchSubmitPayload) => void | Promise<void>;
  onFreeText: (query: string) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  testIdPrefix?: string;
  oneClickSelect?: boolean; // Enable one-click address selection
};

const DEFAULT_HINT = 'Pick an address to view statutory notices nearby.';
const ONE_CLICK_HINT = 'Start typing an address or postcode, then click to search instantly.';

export function AddressSearchBar({
  value,
  onValueChange,
  onSubmit,
  onFreeText,
  placeholder = 'Enter an address or postcode',
  hint,
  disabled,
  autoFocus,
  testIdPrefix = 'address',
  oneClickSelect = false,
}: AddressSearchBarProps) {
  // Use appropriate hint based on mode
  const effectiveHint = hint ?? (oneClickSelect ? ONE_CLICK_HINT : DEFAULT_HINT);
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedValue = value.trim();
  const hasQueryForSuggest = canQuery(trimmedValue);
  const debugMode = addressDebugEnabled();
  const renderDebugBadge = React.useCallback(
    (label: string, count: number, variant: 'total' | 'primary' | 'fallback' | 'unknown' = 'total') => {
      const variantClass = variant === 'primary'
        ? 'bg-blue-100 text-blue-700'
        : variant === 'fallback'
          ? 'bg-amber-100 text-amber-700'
          : variant === 'unknown'
            ? 'bg-slate-200 text-slate-700'
            : 'bg-slate-100 text-slate-600';
      return (
        <span
          key={`${label}-${variant}`}
          className={`inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold ${variantClass}`}
        >
          {label} {count}
        </span>
      );
    },
    []
  );
  const debugCounts = React.useMemo(() => {
    if (!debugMode) return null;
    const counts: Record<'primary' | 'fallback' | 'unknown', number> = {
      primary: 0,
      fallback: 0,
      unknown: 0,
    };
    for (const item of suggestions) {
      const key = (item.source ?? 'unknown') as keyof typeof counts;
      counts[key] += 1;
    }
    return { ...counts, total: suggestions.length };
  }, [debugMode, suggestions]);
  const showMenu = menuVisible && isFocused && (
    loading ||
    fetchError !== null ||
    suggestions.length > 0 ||
    hasQueryForSuggest
  );
  const showEmptyState = !loading && !fetchError && suggestions.length === 0 && hasQueryForSuggest;
  const showNudge = !loading && !fetchError && hasQueryForSuggest && suggestions.length < 3;
  const freeTextQuery = trimmedValue;
  const showFreeText = freeTextQuery.length > 0;
  const listboxId = `${testIdPrefix}-suggestions`;
  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  const resetSuggestions = React.useCallback(() => {
    setSuggestions([]);
    setActiveIndex(-1);
    setFetchError(null);
    setLoading(false);
    setMenuVisible(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => resetSuggestions();
  }, [resetSuggestions]);

  React.useEffect(() => {
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[address-search] effect executed', {
        isFocused,
        hasQueryForSuggest,
        value: trimmedValue,
        length: trimmedValue.length,
      });
    }
    if (!isFocused) {
      resetSuggestions();
      return;
    }
    if (!hasQueryForSuggest) {
      resetSuggestions();
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }

    setLoading(true);
    setFetchError(null);
    setActiveIndex(-1);
    setMenuVisible(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const queryForSuggestions = trimmedValue;
    debounceRef.current = setTimeout(async () => {
      if (typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug('[address-search] debounce fired', {
          query: queryForSuggestions,
          length: queryForSuggestions.length,
        });
      }
      try {
        if (typeof console !== 'undefined' && typeof console.debug === 'function') {
          console.debug('[address-search] invoking fetchAddressSuggestions', {
            query: queryForSuggestions,
          });
        }
        const results = await fetchAddressSuggestions(trimmedValue, { signal: controller.signal });
        setSuggestions(results);
        setMenuVisible(true);
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        setFetchError('Couldn’t fetch suggestions. Try again.');
        setSuggestions([]);
        setMenuVisible(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      controller.abort();
    };
  }, [hasQueryForSuggest, isFocused, resetSuggestions, trimmedValue]);

  React.useEffect(() => {
    if (suggestions.length === 0) {
      setActiveIndex(-1);
    } else {
      setActiveIndex((prev) => {
        if (prev < 0) return prev;
        return Math.min(prev, suggestions.length - 1);
      });
    }
  }, [suggestions]);

  const submitSearch = React.useCallback(
    (suggestion?: AddressSuggestion) => {
      const query = suggestion?.label ?? value;
      resetSuggestions();
      onSubmit({ query: query.trim(), suggestion });
      // Blur the input to ensure dropdown closes
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    [onSubmit, resetSuggestions, value]
  );

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const suggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      submitSearch(suggestion);
    },
    [activeIndex, submitSearch, suggestions]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (!suggestions.length) return;
        event.preventDefault();
        setMenuVisible(true);
        setActiveIndex((prev) => {
          if (prev < 0) return 0;
          return (prev + 1) % suggestions.length;
        });
      } else if (event.key === 'ArrowUp') {
        if (!suggestions.length) return;
        event.preventDefault();
        setMenuVisible(true);
        setActiveIndex((prev) => {
          if (prev < 0) return suggestions.length - 1;
          return prev === 0 ? suggestions.length - 1 : prev - 1;
        });
      } else if (event.key === 'Enter') {
        const suggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
        if (suggestion) {
          event.preventDefault();
          submitSearch(suggestion);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        resetSuggestions();
      }
    },
    [activeIndex, resetSuggestions, submitSearch, suggestions]
  );

  return (
    <form className="space-y-2" onSubmit={handleSubmit} role="search" aria-label="Search statutory notices by address">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label className="sr-only" htmlFor={`${testIdPrefix}-address-input`}>
            {placeholder}
          </label>
          <input
            ref={inputRef}
            id={`${testIdPrefix}-address-input`}
            data-testid={`${testIdPrefix}-address-input`}
            type="text"
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (typeof console !== 'undefined' && typeof console.debug === 'function') {
                console.debug('[address-search] input change', {
                  value: nextValue,
                  length: nextValue.trim().length,
                });
              }
              onValueChange(nextValue);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              window.setTimeout(() => setMenuVisible(false), 100);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showMenu}
            aria-controls={showMenu ? listboxId : undefined}
            aria-activedescendant={showMenu ? activeOptionId : undefined}
            disabled={disabled}
            autoFocus={autoFocus}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70"
          />
          {showMenu && (
            <ul
              id={listboxId}
              data-testid={`${testIdPrefix}-suggest-menu`}
              role="listbox"
              aria-label="Address suggestions"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
            >
              {debugCounts && (
                <li className="flex items-center gap-2 border-b border-slate-100 px-3 pb-2 text-[11px] font-medium text-muted-foreground select-none">
                  <span className="text-slate-600">Suggestions</span>
                  {renderDebugBadge('total', debugCounts.total, 'total')}
                  {renderDebugBadge('primary', debugCounts.primary, 'primary')}
                  {renderDebugBadge('fallback', debugCounts.fallback, 'fallback')}
                  {debugCounts.unknown > 0 && renderDebugBadge('other', debugCounts.unknown, 'unknown')}
                </li>
              )}
              {loading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Searching…
                  </span>
                </li>
              )}
              {!loading && fetchError && (
                <li className="px-3 py-2 text-sm text-rose-600">{fetchError}</li>
              )}
              {!loading && !fetchError && suggestions.map((suggestion, index) => {
                const parts = suggestion.label.split(',').map(p => p.trim());
                const firstLine = parts[0] || suggestion.label;
                const restOfAddress = parts.slice(1).join(', ');

                return (
                  <li
                    key={`${suggestion.id}-${index}`}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-testid={`${testIdPrefix}-suggest-item`}
                    className={`cursor-pointer px-4 py-3 text-sm transition-colors duration-150 ${
                      index === activeIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    } ${index > 0 ? 'border-t border-slate-100' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();  // Prevent blur event from firing
                      submitSearch(suggestion);
                    }}
                  >
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className={`block font-semibold ${index === activeIndex ? 'text-blue-900' : 'text-slate-900'}`}>
                        {firstLine}
                      </span>
                      {restOfAddress && (
                        <span className={`block text-xs ${index === activeIndex ? 'text-blue-700' : 'text-slate-500'}`}>
                          {restOfAddress}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              {showEmptyState && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No suggestions</li>
              )}
              {showNudge && (
                <li className="px-3 py-2 text-xs text-muted-foreground select-none">
                  Not finding your address? Try full postcode or "street + town".
                </li>
              )}
              {showFreeText && (
                <li
                  data-testid={`${testIdPrefix}-suggest-free`}
                  role="option"
                  aria-selected={false}
                  className="cursor-pointer px-3 py-2 text-sm text-blue-700 hover:bg-muted/60"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    resetSuggestions();
                    onFreeText(freeTextQuery);
                  }}
                >
                  Search for “{freeTextQuery}” → results
                </li>
              )}
            </ul>
          )}
        </div>
        {!oneClickSelect && (
          <button
            type="submit"
            data-testid={`${testIdPrefix}-search-btn`}
            disabled={disabled}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 md:h-12 md:w-auto"
          >
            Search
          </button>
        )}
      </div>
      {effectiveHint && <p className="text-xs text-slate-500">{effectiveHint}</p>}
    </form>
  );
}

export default AddressSearchBar;
