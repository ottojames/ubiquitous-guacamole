import React, { useEffect, useId, useRef, useState } from 'react';

export interface AddressOption {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  line3?: string;
  city?: string;
  postcode?: string;
  uprn?: string;
  paon?: string;
  saon?: string | null;
  buildingName?: string | null;
  street?: string;
  town?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  onSelect: (a: AddressOption) => void;
  onManual?: () => void;
}

export default function AddressAutocomplete({ onSelect, onManual }: Props) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const listboxId = useId();
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) {
      setOptions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('bad response');
        const json = await res.json();
        setOptions(json.results || []);
      } catch {
        setError('Unable to search');
        setOptions([]);
      } finally {
        setLoading(false);
        setOpen(true);
        setActive(0);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const select = (opt: AddressOption) => {
    onSelect(opt);
    setQuery(opt.label);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[active]) select(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" onBlur={handleBlur}>
      <label className="block text-sm font-medium mb-1">Premises address</label>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && options[active] ? `${listboxId}-opt-${active}` : undefined}
        className="w-full border rounded p-2 focus-visible:ring-2 ring-offset-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white border rounded shadow-sm max-h-60 overflow-auto"
        >
          {loading && (
            <li className="px-2 py-1 text-sm text-slate-500">Loading…</li>
          )}
          {!loading && error && (
            <li className="px-2 py-1 text-sm text-slate-500">{error}</li>
          )}
          {!loading && !error && options.length === 0 && (
            <li className="px-2 py-1 text-sm text-slate-500">No results</li>
          )}
          {!loading && !error &&
            options.map((o, i) => (
              <li
                key={o.id || i}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={`px-2 py-1 cursor-pointer text-sm ${i === active ? 'bg-slate-100' : ''}`}
                onMouseDown={() => select(o)}
              >
                {o.label}
              </li>
            ))}
          {onManual && (
            <li
              role="option"
              aria-selected={false}
              className="px-2 py-1 cursor-pointer text-sm text-blue-600 hover:bg-slate-100"
              onMouseDown={() => {
                onManual();
                setOpen(false);
              }}
            >
              Enter manually
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
