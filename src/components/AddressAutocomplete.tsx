import { useState, useMemo } from "react";
import debounce from "lodash.debounce";

export type StructuredAddress = {
  line1: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode?: string;
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const provider = import.meta.env.VITE_ADDRESS_PROVIDER || "nominatim";
      const url =
        provider === "nominatim"
          ? `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}`
          : `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const json = await res.json();
      setSuggestions(json.slice(0, 8));
      setOpen(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const debounced = useMemo(() => debounce(runSearch, 300), []);

  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          debounced(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && <div className="mt-1 text-xs text-slate-500">Searching…</div>}
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
          {suggestions.map((s) => {
            const a = s.address || {};
            const postcode = a.postcode || "";
            const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
            const city = a.city || a.town || a.village || a.hamlet || a.suburb;
            const county = a.state || a.county;
            const display = [line1 || s.display_name.split(",")[0], city, postcode]
              .filter(Boolean)
              .join(", ");
            return (
              <button
                key={s.place_id}
                type="button"
                className="block w-full text-left px-3 py-2 hover:bg-slate-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect({
                    line1: line1 || s.display_name,
                    city,
                    county,
                    postcode,
                  });
                  setOpen(false);
                }}
              >
                {display}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
