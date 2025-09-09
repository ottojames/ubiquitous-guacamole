import React, { useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";

export type StructuredAddress = {
  line1: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
};

const UK_POSTCODE_FULL_RE =
  /\b(GIR\s?0AA|[A-PR-UWYZ][0-9][0-9]?[A-Z]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9]?[A-Z]?|[A-PR-UWYZ][0-9][A-HJKMNPR-Y]|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRV-Y])\s*[0-9][ABD-HJLNP-UW-Z]{2}\b/i;

type Suggestion = { id: string; display: string; data: StructuredAddress };

// normalize e.g. "CH47BB" -> "CH4 7BB"
const normalizePostcode = (raw: string) => {
  const s = raw.toUpperCase().replace(/\s+/g, "");
  if (s.length < 5) return raw.trim();
  return `${s.slice(0, s.length - 3)} ${s.slice(-3)}`.trim();
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address…",
}: {
  value?: string;
  onChange: (v: string) => void;
  onSelect: (addr: StructuredAddress) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // --- providers ------------------------------------------------------------
  const fetchGetAddress = async (postcode: string): Promise<Suggestion[]> => {
    const url = `/api/getaddress?postcode=${encodeURIComponent(postcode)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();

    const lat = typeof json.latitude === "number" ? (json.latitude as number) : undefined;
    const lon = typeof json.longitude === "number" ? (json.longitude as number) : undefined;

    return (json.addresses || []).map((a: any, idx: number) => {
      const line1 = a.line_1 || "";
      const line2 = [a.line_2, a.line_3].filter(Boolean).join(", ");
      const city = a.town_or_city || "";
      const county = a.county || "";
      const pc = (json.postcode || postcode).toUpperCase();
      const display = [line1, line2, city, county, pc].filter(Boolean).join(", ");
      return { id: `ga_${idx}`, display, data: { line1, line2, city, county, postcode: pc, lat, lon } };
    });
  };

  const fetchNominatim = async (q: string): Promise<Suggestion[]> => {
    const base = "https://nominatim.openstreetmap.org/search";
    const params = new URLSearchParams({
      format: "json",
      addressdetails: "1",
      countrycodes: "gb",
      q,
      limit: "10",
    });
    const res = await fetch(`${base}?${params.toString()}`, {
      headers: { Accept: "application/json", "Accept-Language": "en-GB" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.slice(0, 10).map((s: any) => {
      const a = s.address || {};
      const postcode = (a.postcode || "").toUpperCase();
      const line1 = [a.house_number, a.road || a.pedestrian].filter(Boolean).join(" ");
      const city = a.city || a.town || a.village || a.hamlet || a.suburb;
      const county = a.county || a.state_district || a.state;
      const display = [line1 || s.display_name.split(",")[0], city, postcode].filter(Boolean).join(", ");
      return {
        id: `nm_${s.place_id}`,
        display,
        data: {
          line1: line1 || s.display_name,
          city,
          county,
          postcode,
          lat: parseFloat(s.lat),
          lon: parseFloat(s.lon),
        },
      };
    });
  };

  // --- search orchestration -------------------------------------------------
  const runSearch = async (raw: string) => {
    const q = (raw || "").trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // cancel in-flight
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    setLoading(true);
    try {
      // Always fetch Nominatim first for partials
      const nomi = await fetchNominatim(q);

      // If full UK postcode, also fetch the official list via server proxy
      const normalized = normalizePostcode(q);
      let list = nomi;
      if (UK_POSTCODE_FULL_RE.test(normalized)) {
        const ga = await fetchGetAddress(normalized);
        if (ga.length) list = [...ga, ...nomi];
      }

      if (!ac.signal.aborted) {
        setSuggestions(list);
        setOpen(list.length > 0);
      }
    } catch {
      if (!ac.signal.aborted) {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  const debounced = useMemo(() => debounce(runSearch, 250), []);

  // --- UI -------------------------------------------------------------------
  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          debounced(v);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {loading && <div className="mt-1 text-xs text-slate-500">Searching…</div>}

      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow max-h-80 overflow-auto">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="block w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s.data);
                onChange(
                  [s.data.line1, s.data.line2, s.data.city, s.data.county, s.data.postcode]
                    .filter(Boolean)
                    .join(", ")
                );
                setOpen(false);
              }}
            >
              {s.display}
            </button>
          ))}
        </div>
      )}

      {!loading && open && suggestions.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow px-3 py-2 text-xs text-slate-500">
          No results
        </div>
      )}
    </div>
  );
}
