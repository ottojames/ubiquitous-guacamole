import React from 'react';
import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';

import { makeAddressSearcher, type AddressSuggestion } from '@/lib/addressLookup';
import { formatUKPostcode } from '@/lib/ukPostcode';

export type AddressItem = AddressSuggestion;

type Props = {
  value?: string;
  onChange?: (value: string) => void;           // manual typing only
  onPick?: (item: AddressItem) => void | Promise<void>; // suggestion selection only (async-safe)
  placeholder?: string;
  minChars?: number;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputTestId?: string;
  describedBy?: string;
};

type ManualFields = {
  addr1: string;
  addr2: string;
  town: string;
  postcode: string;
};

const DEFAULT_PLACEHOLDER =
  'Start typing a postcode or part of the address. Postcode gives the quickest results.';
const DEFAULT_MIN_CHARS = 3;
const MAX_RESULTS = 500;

const fuseOptions: IFuseOptions<AddressItem> = {
  keys: ['label'],
  threshold: 0.4,
  ignoreLocation: true,
};

export default function AddressSearch({
  value,
  onChange,
  onPick,
  placeholder = DEFAULT_PLACEHOLDER,
  minChars = DEFAULT_MIN_CHARS,
  name = 'premisesSearch',
  required = true,
  autoFocus,
  inputTestId,
  describedBy,
}: Props) {
  const generatedId = React.useId();
  const inputId = name || generatedId;
  const listboxId = `${inputId}-listbox`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const [inputValue, setInputValue] = React.useState<string>(value ?? '');
  const [rawItems, setRawItems] = React.useState<AddressItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isOpen, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(-1);
  const [focused, setFocused] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [manualFields, setManualFields] = React.useState<ManualFields>({
    addr1: '',
    addr2: '',
    town: '',
    postcode: '',
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const manualLine1Ref = React.useRef<HTMLInputElement | null>(null);
  const search = React.useMemo(() => makeAddressSearcher(), []);
  const focusedRef = React.useRef(focused);
  const suppressSearchRef = React.useRef(false);

  React.useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  React.useEffect(() => {
    if (manualMode) return;
    setInputValue(value ?? '');
    setOpen(false);
    setHi(-1);
  }, [manualMode, value]);

  React.useEffect(() => {
    if (manualMode) {
      setRawItems([]);
      setError(null);
      setLoading(false);
      setOpen(false);
      setHi(-1);
      return;
    }

    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      setOpen(false);
      setHi(-1);
      setLoading(false);
      setRawItems([]);
      setError(null);
      return;
    }

    const trimmed = inputValue.trim();
    if (trimmed.length < minChars) {
      setRawItems([]);
      setError(null);
      setLoading(false);
      setOpen(false);
      setHi(-1);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    search(trimmed)
      .then((items) => {
        if (!isActive) return;
        setRawItems(items);
        setOpen(items.length > 0 || trimmed.length >= minChars);
        setHi((prev) => (items.length ? Math.min(prev, items.length - 1) : -1));
      })
      .catch((err: any) => {
        if (!isActive) return;
        const msg = typeof err?.message === 'string' ? err.message : 'Address lookup unavailable. Check your connection and try again.';
        setError(msg);
        setRawItems([]);
        setOpen(false);
        setHi(-1);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [inputValue, manualMode, minChars, search]);

  const refined = React.useMemo(() => {
    if (!rawItems.length) return [];
    const trimmed = inputValue.trim();
    if (!trimmed) return rawItems.slice(0, MAX_RESULTS);
    const fuse = new Fuse(rawItems, fuseOptions);
    const results = fuse.search(trimmed).map((entry) => entry.item);
    return (results.length ? results : rawItems).slice(0, MAX_RESULTS);
  }, [inputValue, rawItems]);

  const trimmedInput = inputValue.trim();
  const canShowManualOption = !manualMode && trimmedInput.length >= minChars;
  const manualOptionId = `${listboxId}-option-manual`;

  React.useEffect(() => {
    if (manualMode) {
      setOpen(false);
      setHi(-1);
      return;
    }
    if (!focused) {
      setOpen(false);
      setHi(-1);
    } else if (refined.length > 0) {
      setOpen(true);
    }
  }, [focused, manualMode, refined.length]);

  React.useEffect(() => {
    if (!manualMode) return;
    setOpen(false);
    setHi(-1);
    setFocused(false);
    const timer = window.setTimeout(() => {
      manualLine1Ref.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [manualMode]);

  React.useEffect(() => {
    const onDocClick = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
      setHi(-1);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, []);

  // Manual-typing commit → parent onChange
  const commitValue = React.useCallback(
    (next: string) => {
      const finalValue = next.trim();
      setInputValue(finalValue);
      setOpen(false);
      setHi(-1);
      onChange?.(finalValue); // only for manual typing
    },
    [onChange],
  );

  // PICK: do NOT call onChange; only onPick (prevents postcode pollution)
  const commitPick = React.useCallback(
    (item: AddressItem) => {
      suppressSearchRef.current = true;
      setLoading(false);
      setError(null);
      setRawItems([]);
      setInputValue(item.label); // reflect the pick in the input UI
      setOpen(false);
      setHi(-1);
      onPick?.(item); // parent resolves and fills textarea/postcode/council
    },
    [onPick],
  );

  const commitManualAddress = React.useCallback(
    (fields: ManualFields) => {
      const parts = [fields.addr1, fields.addr2, fields.town, fields.postcode]
        .map((part) => part.trim())
        .filter(Boolean);
      const combined = parts.join('\n');
      onChange?.(combined);
    },
    [onChange],
  );

  const handleManualFieldChange = React.useCallback(
    (key: keyof ManualFields, rawValue: string) => {
      const value = key === 'postcode' ? formatUKPostcode(rawValue) : rawValue;
      setManualFields((prev) => {
        const next = { ...prev, [key]: value };
        commitManualAddress(next);
        return next;
      });
    },
    [commitManualAddress],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (manualMode) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const totalOptions = refined.length + (canShowManualOption ? 1 : 0);
      if (!isOpen && totalOptions) {
        setOpen(true);
        setHi(0);
        return;
      }
      if (totalOptions) setHi((prev) => (prev + 1) % totalOptions);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const totalOptions = refined.length + (canShowManualOption ? 1 : 0);
      if (!isOpen && totalOptions) {
        setOpen(true);
        setHi(totalOptions - 1);
        return;
      }
      if (totalOptions) setHi((prev) => (prev - 1 + totalOptions) % totalOptions);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const totalOptions = refined.length + (canShowManualOption ? 1 : 0);
      if (isOpen && hi >= 0 && hi < totalOptions) {
        if (hi < refined.length) {
          const item = refined[hi];
          commitPick(item);
        } else if (canShowManualOption) {
          setManualMode(true);
          setOpen(false);
          setHi(-1);
        }
      } else {
        // manual submit — uses onChange
        commitValue(inputValue);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setHi(-1);
    }
  };

  const helperText = manualMode
    ? 'Enter the address manually. Address line 1, Town/City and Postcode are required.'
    : loading
    ? 'Searching…'
    : 'Start typing to look up the premises and pre-fill council details.';

  const totalOptions = refined.length + (canShowManualOption ? 1 : 0);
  const showDropdown = !manualMode && isOpen && totalOptions > 0;
  const activeId = (() => {
    if (hi >= 0 && hi < refined.length) return `${listboxId}-option-${hi}`;
    if (canShowManualOption && hi === refined.length) return manualOptionId;
    return undefined;
  })();

  const manualIds = {
    addr1: `${inputId}-manual-line1`,
    addr2: `${inputId}-manual-line2`,
    town: `${inputId}-manual-town`,
    postcode: `${inputId}-manual-postcode`,
  };

  return (
    <div ref={rootRef} className="relative">
      {!manualMode && (
        <>
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="text"
            required={required}
            autoFocus={autoFocus}
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showDropdown}
            aria-activedescendant={activeId}
            aria-describedby={[helperId, error ? errorId : undefined, describedBy]
              .filter(Boolean)
              .join(' ') || undefined}
            data-testid={inputTestId}
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
          {showDropdown && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl"
            >
              {refined.map((item, index) => {
                const highlighted = index === hi;
                return (
                  <li
                    key={`${item.id}-${index}`}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={highlighted}
                    className={`cursor-pointer px-3 py-2 ${
                      highlighted ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onMouseEnter={() => setHi(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitPick(item);
                    }}
                  >
                    {item.label}
                  </li>
                );
              })}
              {canShowManualOption && (
                <li
                  id={manualOptionId}
                  role="option"
                  aria-selected={hi === refined.length}
                  className={`cursor-pointer border-t border-slate-200 px-3 py-2 font-medium text-indigo-700 hover:bg-indigo-50 ${
                    hi === refined.length ? 'bg-indigo-50' : ''
                  }`}
                  onMouseEnter={() => setHi(refined.length)}
                  onClick={(event) => {
                    event.preventDefault();
                    setManualMode(true);
                    setOpen(false);
                    setHi(-1);
                  }}
                >
                  My address isn’t listed — enter manually
                </li>
              )}
            </ul>
          )}
        </>
      )}

      {manualMode && (
        <div className="mt-2 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={manualIds.addr1} className="block text-sm font-medium text-gray-900">
                Address line 1 <span className="text-red-500">*</span>
              </label>
              <input
                ref={manualLine1Ref}
                id={manualIds.addr1}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={manualFields.addr1}
                onChange={(event) => handleManualFieldChange('addr1', event.target.value)}
                required
                autoComplete="address-line1"
              />
            </div>
            <div>
              <label htmlFor={manualIds.addr2} className="block text-sm font-medium text-gray-900">
                Address line 2
              </label>
              <input
                id={manualIds.addr2}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={manualFields.addr2}
                onChange={(event) => handleManualFieldChange('addr2', event.target.value)}
                autoComplete="address-line2"
              />
            </div>
            <div>
              <label htmlFor={manualIds.town} className="block text-sm font-medium text-gray-900">
                Town/City <span className="text-red-500">*</span>
              </label>
              <input
                id={manualIds.town}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={manualFields.town}
                onChange={(event) => handleManualFieldChange('town', event.target.value)}
                required
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label htmlFor={manualIds.postcode} className="block text-sm font-medium text-gray-900">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                id={manualIds.postcode}
                className="w-full uppercase rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={manualFields.postcode}
                onChange={(event) => handleManualFieldChange('postcode', event.target.value)}
                required
                pattern="[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}"
                autoComplete="postal-code"
                inputMode="text"
              />
            </div>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-indigo-700 underline underline-offset-2"
            onClick={() => {
              setManualMode(false);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            Back to search
          </button>
        </div>
      )}

      <div id={helperId} className="mt-1 text-xs text-slate-500">
        {helperText}
      </div>
      {error && (
        <div id={errorId} className="mt-1 text-xs text-rose-600">
          {error}
        </div>
      )}
    </div>
  );
}
