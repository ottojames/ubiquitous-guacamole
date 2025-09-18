import React, { useEffect, useMemo, useRef, useState } from 'react';
import councils from '@/data/councils.json';

export type Council = {
  name: string;
  email: string;
  address?: string;
  aliases?: string[];
};

type Props = {
  value?: string;
  onSelect: (council: Council) => void;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  label?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  error?: string;
};

function norm(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim();
}

export default function CouncilSelect({
  value,
  onSelect,
  onChangeText,
  onBlur,
  inputRef,
  label = 'Council name',
  placeholder = 'Search councils…',
  id = 'council-name',
  required = true,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>(value ?? '');
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? fallbackRef;
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef(false);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  const options = useMemo(() => {
    const q = norm(query);
    return (councils as Council[])
      .filter((council) => {
        if (!q) return true;
        if (norm(council.name).includes(q)) return true;
        return (council.aliases ?? []).some((alias) => norm(alias).includes(q));
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 30);
  }, [query]);

  useEffect(() => {
    setActiveIdx(options.length ? 0 : -1);
    if (query.trim()) {
      setOpen(options.length > 0);
    }
  }, [options.length, query]);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target as Node)) return;
      setOpen(false);
      pointerDownRef.current = false;
    }
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  function select(option: Council) {
    setQuery(option.name);
    setOpen(false);
    onSelect(option);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (!open) {
      if (event.key === 'Enter' && query.trim()) {
        event.preventDefault();
        onSelect({ name: query.trim(), email: '', address: '', aliases: [] });
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIdx((idx) => Math.min(idx + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIdx >= 0 && activeIdx < options.length) {
        select(options[activeIdx]);
      } else if (query.trim()) {
        onSelect({ name: query.trim(), email: '', address: '', aliases: [] });
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative mt-1">
        <input
          ref={resolvedInputRef}
          id={id}
          type="text"
          className={`w-full rounded-2xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            onChangeText?.(next);
          }}
          onMouseDownCapture={() => {
            pointerDownRef.current = true;
          }}
          onMouseUpCapture={() => {
            pointerDownRef.current = false;
          }}
          onFocus={() => {
            if (pointerDownRef.current) return;
            setOpen(options.length > 0);
          }}
          onClick={() => {
            setOpen((prev) => (options.length > 0 ? !prev : false));
            pointerDownRef.current = false;
          }}
          onBlur={() => {
            if (typeof window === 'undefined') {
              setOpen(false);
              onBlur?.();
              return;
            }
            window.requestAnimationFrame(() => {
              const root = rootRef.current;
              const active = document.activeElement;
              if (root && active && root.contains(active)) {
                return;
              }
              setOpen(false);
              onBlur?.();
              pointerDownRef.current = false;
            });
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined}
          aria-invalid={error ? 'true' : undefined}
        />
        {open && options.length > 0 && (
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border bg-white p-1 shadow-xl"
          >
            {options.map((option, index) => (
              <li
                id={`${id}-opt-${index}`}
                key={option.name}
                role="option"
                aria-selected={index === activeIdx}
                className={`cursor-pointer rounded-xl px-3 py-2 ${
                  index === activeIdx ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(option);
                }}
                onMouseEnter={() => setActiveIdx(index)}
              >
                <div className="text-sm font-medium text-gray-900">{option.name}</div>
                <div className="text-xs text-gray-500">{option.email || 'No email listed'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">Licensing authority responsible for this notice.</p>
      )}
    </div>
  );
}
