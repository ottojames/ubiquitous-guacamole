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
      // London
      { id: "1", label: "10 Downing Street, London", description: "SW1A 2AA", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "2", label: "Buckingham Palace, London", description: "SW1A 1AA", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "3", label: "221B Baker Street, London", description: "NW1 6XE", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "4", label: "9 Lower Park Road, London", description: "SW14 7EJ", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "5", label: "The Old Brewery, London", description: "E1 6EA", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "6", label: "Platform 9¾, Kings Cross, London", description: "N1 9AP", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "7", label: "Tower Bridge Road, London", description: "SE1 2UP", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "8", label: "Abbey Road Studios, London", description: "NW8 9AY", town: "London", county: "Greater London", payload: { county: "Greater London" } },
      { id: "9", label: "The Shard, London", description: "SE1 9SG", town: "London", county: "Greater London", payload: { county: "Greater London" } },

      // Chester - CRITICAL: User specifically requested Chester addresses for "9 lowe" search
      { id: "32", label: "9 Lower Bridge Street, Chester", description: "CH1 1RS", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "33", label: "9 Lower Park Road, Chester", description: "CH4 7BB", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "34", label: "9 Lowes Lane, Chester", description: "CH2 3AX", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "35", label: "Chester Town Hall, Chester", description: "CH1 2HJ", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "36", label: "Chester Cathedral, Chester", description: "CH1 2DY", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "37", label: "The Rows, Chester", description: "CH1 1NW", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "38", label: "Chester Racecourse, Chester", description: "CH1 2LY", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "39", label: "Chester Castle, Chester", description: "CH1 2DN", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "40", label: "Grosvenor Park, Chester", description: "CH1 1SD", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },
      { id: "41", label: "9 Lowell Drive, Chester", description: "CH3 5TQ", town: "Chester", county: "Cheshire", payload: { county: "Cheshire" } },

      // Robsart Street addresses (London, Lambeth)
      { id: "56", label: "1 Robsart Street, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },
      { id: "57", label: "5 Robsart Street, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },
      { id: "58", label: "10 Robsart Street, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },
      { id: "59", label: "15 Robsart Street, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },
      { id: "60", label: "20 Robsart Street, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },
      { id: "61", label: "Robsart Street Community Centre, London", description: "SW9 0FB", town: "London", county: "Lambeth", payload: { county: "Lambeth" } },

      // Manchester
      { id: "10", label: "1 Piccadilly Gardens, Manchester", description: "M1 1RG", town: "Manchester", county: "Greater Manchester", payload: { county: "Greater Manchester" } },
      { id: "11", label: "Old Trafford, Manchester", description: "M16 0RA", town: "Manchester", county: "Greater Manchester", payload: { county: "Greater Manchester" } },
      { id: "12", label: "Manchester Town Hall, Manchester", description: "M2 5DB", town: "Manchester", county: "Greater Manchester", payload: { county: "Greater Manchester" } },
      { id: "13", label: "The Printworks, Manchester", description: "M4 2BS", town: "Manchester", county: "Greater Manchester", payload: { county: "Greater Manchester" } },

      // Birmingham
      { id: "14", label: "1 Colmore Row, Birmingham", description: "B3 2BJ", town: "Birmingham", county: "West Midlands", payload: { county: "West Midlands" } },
      { id: "15", label: "Bullring Shopping Centre, Birmingham", description: "B5 4BU", town: "Birmingham", county: "West Midlands", payload: { county: "West Midlands" } },
      { id: "16", label: "Aston Villa Stadium, Birmingham", description: "B6 6HE", town: "Birmingham", county: "West Midlands", payload: { county: "West Midlands" } },
      { id: "42", label: "9 Lower Tower Street, Birmingham", description: "B19 3PU", town: "Birmingham", county: "West Midlands", payload: { county: "West Midlands" } },

      // Edinburgh
      { id: "17", label: "Edinburgh Castle, Edinburgh", description: "EH1 2NG", town: "Edinburgh", county: "Midlothian", payload: { county: "Midlothian" } },
      { id: "18", label: "Princes Street, Edinburgh", description: "EH2 4AD", town: "Edinburgh", county: "Midlothian", payload: { county: "Midlothian" } },
      { id: "19", label: "Royal Mile, Edinburgh", description: "EH1 1RE", town: "Edinburgh", county: "Midlothian", payload: { county: "Midlothian" } },

      // Glasgow
      { id: "20", label: "George Square, Glasgow", description: "G2 1DY", town: "Glasgow", county: "Lanarkshire", payload: { county: "Lanarkshire" } },
      { id: "21", label: "Celtic Park, Glasgow", description: "G40 3RE", town: "Glasgow", county: "Lanarkshire", payload: { county: "Lanarkshire" } },
      { id: "22", label: "Buchanan Street, Glasgow", description: "G1 3HL", town: "Glasgow", county: "Lanarkshire", payload: { county: "Lanarkshire" } },

      // Bristol
      { id: "23", label: "Clifton Suspension Bridge, Bristol", description: "BS8 3PA", town: "Bristol", county: "Bristol", payload: { county: "Bristol" } },
      { id: "24", label: "Bristol Harbourside, Bristol", description: "BS1 5TX", town: "Bristol", county: "Bristol", payload: { county: "Bristol" } },
      { id: "25", label: "Cabot Circus, Bristol", description: "BS1 3BX", town: "Bristol", county: "Bristol", payload: { county: "Bristol" } },
      { id: "43", label: "9 Lower Ashley Road, Bristol", description: "BS2 9QR", town: "Bristol", county: "Bristol", payload: { county: "Bristol" } },

      // Liverpool
      { id: "26", label: "Albert Dock, Liverpool", description: "L3 4BB", town: "Liverpool", county: "Merseyside", payload: { county: "Merseyside" } },
      { id: "27", label: "Anfield Road, Liverpool", description: "L4 0TH", town: "Liverpool", county: "Merseyside", payload: { county: "Merseyside" } },
      { id: "28", label: "Lime Street Station, Liverpool", description: "L1 1JD", town: "Liverpool", county: "Merseyside", payload: { county: "Merseyside" } },
      { id: "44", label: "9 Lower Castle Street, Liverpool", description: "L2 0ND", town: "Liverpool", county: "Merseyside", payload: { county: "Merseyside" } },

      // Leeds
      { id: "29", label: "Leeds Town Hall, Leeds", description: "LS1 3AD", town: "Leeds", county: "West Yorkshire", payload: { county: "West Yorkshire" } },
      { id: "30", label: "Elland Road, Leeds", description: "LS11 0ES", town: "Leeds", county: "West Yorkshire", payload: { county: "West Yorkshire" } },
      { id: "31", label: "Victoria Quarter, Leeds", description: "LS1 6AZ", town: "Leeds", county: "West Yorkshire", payload: { county: "West Yorkshire" } },
      { id: "45", label: "9 Lower Briggate, Leeds", description: "LS1 4BR", town: "Leeds", county: "West Yorkshire", payload: { county: "West Yorkshire" } },

      // Additional UK cities with "9 low*" addresses
      { id: "46", label: "9 Lower High Street, Oxford", description: "OX1 4AH", town: "Oxford", county: "Oxfordshire", payload: { county: "Oxfordshire" } },
      { id: "47", label: "9 Lower Road, Cambridge", description: "CB3 9EU", town: "Cambridge", county: "Cambridgeshire", payload: { county: "Cambridgeshire" } },
      { id: "48", label: "9 Lower Church Lane, York", description: "YO1 7LF", town: "York", county: "North Yorkshire", payload: { county: "North Yorkshire" } },
      { id: "49", label: "9 Lower Street, Newcastle", description: "NE1 5UE", town: "Newcastle", county: "Tyne and Wear", payload: { county: "Tyne and Wear" } },
      { id: "50", label: "9 Lower Parade, Norwich", description: "NR2 1QL", town: "Norwich", county: "Norfolk", payload: { county: "Norfolk" } },
      { id: "51", label: "9 Lower Town, Exeter", description: "EX4 3AJ", town: "Exeter", county: "Devon", payload: { county: "Devon" } },
      { id: "52", label: "9 Lower Green, Southampton", description: "SO14 7DX", town: "Southampton", county: "Hampshire", payload: { county: "Hampshire" } },
      { id: "53", label: "9 Lower Marsh, Cardiff", description: "CF11 6DN", town: "Cardiff", county: "South Glamorgan", payload: { county: "South Glamorgan" } },
      { id: "54", label: "9 Lower Walk, Brighton", description: "BN1 3WJ", town: "Brighton", county: "East Sussex", payload: { county: "East Sussex" } },
      { id: "55", label: "9 Lower Mall, Nottingham", description: "NG1 7ER", town: "Nottingham", county: "Nottinghamshire", payload: { county: "Nottinghamshire" } },
    ].filter((x) => {
      // More robust matching: check all relevant fields including county
      const searchable = [
        x.label,
        x.description,
        x.town,
        x.county || ""
      ].join(" ").toLowerCase();

      // Split query into words for better partial matching
      const queryWords = q.split(/\s+/).filter(Boolean);

      // Address matches if ALL query words are found in searchable text
      return queryWords.every(word => searchable.includes(word));
    });
    await new Promise((r) => setTimeout(r, 200));
    return list as AddressSuggestion[];
  },
  async retrieve(suggestion) {
    const parts = suggestion.label.split(",");
    const line1 = parts[0]?.trim() || "";
    const town = parts[parts.length - 1]?.trim() || "London";

    // Extract county if available from the original suggestion payload
    const county = (suggestion.payload as any)?.county || undefined;

    return {
      line1,
      town,
      county,
      postcode: suggestion.description,
      country: "UK",
      raw: suggestion,
    };
  },
};
