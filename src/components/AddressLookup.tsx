import React, { useCallback, useEffect, useRef, useState, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

// ---------- Types ----------
export type AddressSuggestion = {
  id: string;
  label: string; // Visible in dropdown
  description?: string; // Secondary line
  payload?: any; // Provider raw data
};

export type AddressResult = {
  line1?: string;
  line2?: string;
  line3?: string;
  town?: string;
  county?: string;
  postcode?: string;
  uprn?: string;
  country?: string;
  raw?: any;
};

export interface AddressProvider {
  name: string;
  suggest: (query: string, signal: AbortSignal) => Promise<AddressSuggestion[]>;
  retrieve: (suggestion: AddressSuggestion, signal: AbortSignal) => Promise<AddressResult>;
}

// ---------- Hooks ----------
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useAbortControllerRef() {
  const ref = useRef<AbortController | null>(null);
  const reset = useCallback(() => {
    if (ref.current) ref.current.abort();
    ref.current = new AbortController();
    return ref.current;
  }, []);
  return { ref, reset } as const;
}

// ---------- Component ----------
interface AddressLookupProps {
  provider: AddressProvider;
  placeholder?: string;
  onResolved?: (address: AddressResult, suggestion?: AddressSuggestion) => void;
  className?: string;
  emptyHint?: string;
  autoFocus?: boolean;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  inputTestId?: string;
}

export default function AddressLookup({
  provider,
  placeholder = "Search address or postcode (e.g. W1A 1AA)",
  onResolved,
  className,
  emptyHint = "No addresses found",
  autoFocus,
  inputProps,
  inputTestId,
}: AddressLookupProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250); // must be above the effect using it
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const { reset } = useAbortControllerRef();

  // fetch suggestions
  useEffect(() => {
    const q = debounced?.trim() ?? "";
    if (!q || q.length < 2) {
      setItems([]);
      setError(null);
      return;
    }
    const ctrl = reset();
    setLoading(true);
    setError(null);
    setOpen(true); // open while searching

    provider
      .suggest(q, ctrl.signal)
      .then((results) => {
        setItems(results);
        if (results.length > 0) setOpen(true); // keep open when results land
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Failed to fetch suggestions");
      })
      .finally(() => setLoading(false));
  }, [debounced, provider, reset]);

  // keyboard index mgmt
  useEffect(() => {
    setActiveIndex(items.length > 0 ? 0 : -1);
  }, [items]);

  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  const handleSelect = useCallback(
    async (id: string) => {
      const suggestion = items.find((i) => i.id === id);
      if (!suggestion) return;
      const ctrl = reset();
      setLoading(true);
      setQuery(suggestion.label);
      try {
        const full = await provider.retrieve(suggestion, ctrl.signal);
        onResolved?.(full, suggestion);
        setOpen(false);
        setItems([]);
      } catch (err: any) {
        if (err?.name !== "AbortError") setError(err?.message || "Failed to fetch address");
      } finally {
        setLoading(false);
      }
    },
    [items, onResolved, provider, reset]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!open) setOpen(true);
        setActiveIndex((prev) => {
          if (items.length === 0) return -1;
          const next = prev < items.length - 1 ? prev + 1 : items.length - 1;
          return next < 0 ? 0 : next;
        });
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => {
          if (items.length === 0) return -1;
          const next = prev > 0 ? prev - 1 : 0;
          return next;
        });
        return;
      }
      if (event.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          void handleSelect(items[activeIndex].id);
        }
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    },
    [activeIndex, handleSelect, items, open]
  );

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "w-full rounded-2xl border px-4 py-2 text-sm shadow-sm",
              "focus-within:ring-2 focus-within:ring-ring",
              "bg-white"
            )}
            onClick={() => setOpen(true)}
          >
            <input
              {...inputProps}
              className={cn(
                "w-full bg-transparent outline-none",
                loading && "opacity-80",
                inputProps?.className
              )}
              placeholder={inputProps?.placeholder ?? placeholder}
              value={query}
              onChange={(event) => {
                const v = event.target.value;
                setQuery(v);
                if (v.trim().length >= 2) setOpen(true); // open as user types
                inputProps?.onChange?.(event);
              }}
              onFocus={(event) => {
                setOpen(true);
                inputProps?.onFocus?.(event);
              }}
              onKeyDown={(event) => {
                handleKeyDown(event);
                inputProps?.onKeyDown?.(event);
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={items.length > 0 ? listId : undefined}
              aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
              autoFocus={autoFocus ?? inputProps?.autoFocus}
              data-testid={inputTestId}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[min(640px,90vw)] z-[9999]" align="start" sideOffset={8}>
          <Command className="border-0">
            {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Searching…</div>}

            {error && !loading && (
              <div role="alert" className="px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && items.length === 0 && debounced && (
              <CommandEmpty className="text-xs text-muted-foreground">{emptyHint}</CommandEmpty>
            )}

            {items.length > 0 && (
              <CommandList id={listId} role="listbox" aria-label="Address suggestions">
                {items.map((s, index) => {
                  const optionId = `${listId}-option-${index}`;
                  return (
                    <CommandItem
                      key={s.id}
                      id={optionId}
                      active={index === activeIndex}
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()} // keep input focused
                      onClick={() => void handleSelect(s.id)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{s.label}</span>
                        {s.description && (
                          <span className="text-xs text-muted-foreground">{s.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------- Providers ----------------
export function getAddressProvider(apiKey: string): AddressProvider {
  const base = "/api/getaddress";
  return {
    name: "getaddress.io",
    async suggest(query, signal) {
      const url = `${base}/autocomplete/${encodeURIComponent(query)}?api-key=${apiKey}&all=true`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`getAddress suggest failed (${res.status})`);
      const data = await res.json();
      return (data?.suggestions || []).map((s: any) => ({
        id: s.id,
        label: s.address,
        description: s.postcode,
        payload: s,
      }));
    },
    async retrieve(suggestion, signal) {
      const url = `${base}/get/${encodeURIComponent(suggestion.id)}?api-key=${apiKey}`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`getAddress retrieve failed (${res.status})`);
      const data = await res.json();
      const a = data?.addresses?.[0] || {};
      return {
        line1: a.line_1,
        line2: a.line_2,
        line3: a.line_3,
        town: a.town_or_city,
        county: a.county,
        postcode: data?.postcode,
        uprn: a.udprn || a.uprn,
        country: "UK",
        raw: data,
      };
    },
  };
}

export function mapboxProvider(token: string): AddressProvider {
  const endpoint = "https://api.mapbox.com/geocoding/v5/mapbox.places";
  return {
    name: "mapbox",
    async suggest(query, signal) {
      const url = `${endpoint}/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&types=address,place,postcode&country=gb`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Mapbox suggest failed (${res.status})`);
      const data = await res.json();
      return (data?.features || []).map((f: any) => ({
        id: f.id,
        label: f.place_name,
        description: f.context?.find((c: any) => c.id?.startsWith("postcode"))?.text,
        payload: f,
      }));
    },
    async retrieve(suggestion) {
      const f = suggestion.payload;
      const ctx = (f?.context || []) as any[];
      const postcode = ctx.find((c) => c.id?.startsWith("postcode"))?.text || undefined;
      const town = ctx.find((c) => c.id?.startsWith("place"))?.text || undefined;
      const county = ctx.find((c) => c.id?.startsWith("region"))?.text || undefined;
      return {
        line1: f.text,
        line2: f.address,
        town,
        county,
        postcode,
        country: "UK",
        raw: f,
      };
    },
  };
}

export const mockProvider: AddressProvider = {
  name: "mock",
  async suggest(query) {
    const q = query.toLowerCase();
    const list = [
      { id: "1", label: "10 Downing Street, London SW1A 2AA", description: "SW1A 2AA" },
      { id: "2", label: "Buckingham Palace, London SW1A 1AA", description: "SW1A 1AA" },
      { id: "3", label: "221B Baker Street, London NW1 6XE", description: "NW1 6XE" },
    ].filter((x) => x.label.toLowerCase().includes(q));
    await new Promise((r) => setTimeout(r, 200));
    return list as AddressSuggestion[];
  },
  async retrieve(suggestion) {
    return {
      line1: suggestion.label.split(",")[0],
      town: "London",
      postcode: suggestion.description,
      country: "UK",
      raw: suggestion,
    };
  },
};
