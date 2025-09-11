import React, { useState, useRef, useCallback } from "react";
import * as UI from '@/styles/ui';

function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

interface AsyncComboboxProps<T> {
  label: string;
  placeholder?: string;
  fetchOptions: (query: string) => Promise<T[]>;
  onSelect: (opt: T) => void;
  getOptionLabel: (opt: T) => string;
  getKey: (opt: T) => string;
  required?: boolean;
  inputTestId?: string;
}

export default function AsyncCombobox<T>(props: AsyncComboboxProps<T>) {
  const { label, placeholder = "", fetchOptions, onSelect, getOptionLabel, getKey, required, inputTestId } = props;
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const runFetch = useCallback(async (q: string) => {
    if (!q) {
      setOptions([]);
      setOpen(false);
      return;
    }
    try {
      const opts = await fetchOptions(q);
      setOptions(opts);
      setOpen(true);
      setHighlight(0);
    } catch {
      setOptions([]);
      setOpen(false);
    }
  }, [fetchOptions]);

  const debounced = useRef(debounce(runFetch, 300)).current;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    debounced(v);
  };

  const handleSelect = (opt: T) => {
    setQuery(getOptionLabel(opt));
    setOpen(false);
    onSelect(opt);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) handleSelect(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <label className={UI.label + ' mb-1'}>
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        data-testid={inputTestId}
        className={UI.input + ' w-full'}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKey}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => {
          if (options.length) setOpen(true);
        }}
      />
      {open && options.length > 0 && (
        <ul
          role="listbox"
          ref={listRef}
          className="border border-slate-200 mt-1 rounded-lg bg-white shadow-card max-h-60 overflow-auto"
        >
          {options.map((opt, idx) => (
            <li
              key={getKey(opt)}
              role="option"
              aria-selected={idx === highlight}
              className={`px-3 py-2 cursor-pointer ${idx === highlight ? 'bg-slate-100' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
            >
              {getOptionLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
