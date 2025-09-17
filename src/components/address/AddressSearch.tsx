import React from 'react';
import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';

export type AddressItem = { id: string; label: string };
type AddressResponse = { items: AddressItem[]; source?: string };

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

const DEFAULT_PLACEHOLDER =
  'Start typing a postcode or part of the address. Postcode gives the quickest results.';
const DEFAULT_MIN_CHARS = 2;
const DEBOUNCE_MS = 200;
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

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setInputValue(value ?? '');
    setOpen(false);
    setHi(-1);
  }, [value]);

  React.useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < minChars) {
      abortRef.current?.abort();
      abortRef.current = null;
      setRawItems([]);
      setError(null);
      setLoading(false);
      setOpen(false);
      setHi(-1);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timeout = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/addresses?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!r.ok) {
          let message = `Address lookup failed (${r.status})`;
          try {
            const parsed = await r.json();
            if (parsed?.error) message = parsed.error;
          } catch {}
          setError(message);
          setRawItems([]);
          setOpen(false);
          setHi(-1);
          return;
        }
        const payload = (await r.json()) as AddressResponse;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setRawItems(items);
        setOpen(items.length > 0 && focused);
        setHi((prev) => (items.length ? Math.min(prev, items.length - 1) : -1));
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Address lookup failed');
        setRawItems([]);
        setOpen(false);
        setHi(-1);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue, minChars, focused]);

  const refined = React.useMemo(() => {
    if (!rawItems.length) return [];
    const trimmed = inputValue.trim();
    if (!trimmed) return rawItems.slice(0, MAX_RESULTS);
    const fuse = new Fuse(rawItems, fuseOptions);
    const results = fuse.search(trimmed).map((entry) => entry.item);
    return (results.length ? results : rawItems).slice(0, MAX_RESULTS);
  }, [inputValue, rawItems]);

  React.useEffect(() => {
    if (!focused) {
      setOpen(false);
      setHi(-1);
    } else if (refined.length > 0) {
      setOpen(true);
    }
  }, [focused, refined.length]);

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

  React.useEffect(() => () => abortRef.current?.abort(), []);

  // Manual-typing commit → parent onChange
  const commitValue = React.useCallback(
    (next: string) => {
      const finalValue = next.trim();
      setInputValue(finalValue);
      setOpen(false);
      setHi(-1);
      onChange?.(finalValue); // only for manual typing
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [onChange],
  );

  // PICK: do NOT call onChange; only onPick (prevents postcode pollution)
  const commitPick = React.useCallback(
    (item: AddressItem) => {
      setInputValue(item.label); // reflect the pick in the input UI
      setOpen(false);
      setHi(-1);
      abortRef.current?.abort();
      abortRef.current = null;
      onPick?.(item);            // parent resolves and fills textarea/postcode/council
    },
    [onPick],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen && refined.length) {
        setOpen(true);
        setHi(0);
        return;
      }
      if (refined.length) setHi((prev) => (prev + 1) % refined.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen && refined.length) {
        setOpen(true);
        setHi(refined.length - 1);
        return;
      }
      if (refined.length) setHi((prev) => (prev - 1 + refined.length) % refined.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isOpen && hi >= 0 && hi < refined.length) {
        // pick with keyboard — NO onChange
        const item = refined[hi];
        commitPick(item);
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

  const helperText = loading
    ? 'Searching…'
    : 'Start typing to look up the premises and pre-fill council details.';

  const showDropdown = isOpen && refined.length > 0;
  const activeId = hi >= 0 && hi < refined.length ? `${listboxId}-option-${hi}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <input
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
                  commitPick(item); // NO onChange here
                }}
              >
                {item.label}
              </li>
            );
          })}
        </ul>
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
