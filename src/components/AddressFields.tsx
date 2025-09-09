import React, {useEffect, useMemo, useRef, useState} from "react";
import debounce from "lodash.debounce";

export type AddressValue = {
  line1: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode: string;
};

type Props = {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  required?: boolean;
  label?: string;
};

type GASuggestion = {
  line_1?: string; line_2?: string; line_3?: string;
  town_or_city?: string; county?: string;
};
type GAResponse = { postcode: string; addresses: GASuggestion[] };

/** NOTE: expects a server route at /api/getaddress?postcode=... that returns getAddress.io data */
export default function AddressFields({ value, onChange, required, label = "Premises address" }: Props) {
  const [postcode, setPostcode] = useState(value.postcode ?? "");
  const [query, setQuery] = useState(value.line1 ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AddressValue[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchAddresses = async (pc: string) => {
    const clean = pc.trim().toUpperCase();
    if (!clean || clean.length < 5) { setOptions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/getaddress?postcode=${encodeURIComponent(clean)}`);
      if (!res.ok) { setOptions([]); return; }
      const json: GAResponse = await res.json();
      const opts = (json.addresses || []).map((a): AddressValue => ({
        line1: a.line_1 || "",
        line2: [a.line_2, a.line_3].filter(Boolean).join(", "),
        city: a.town_or_city || "",
        county: a.county || "",
        postcode: json.postcode || clean,
      }));
      setOptions(opts);
      setOpen(opts.length > 0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchAddresses, 300), []);

  // Kick off search when postcode changes
  useEffect(() => {
    if (postcode && postcode !== value.postcode) debouncedFetch(postcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode]);

  return (
    <div className="space-y-2">
      <p className="block text-sm font-medium text-slate-700">{label}</p>

      <div className="grid grid-cols-5 gap-2">
        {/* Postcode */}
        <input
          className="col-span-2 rounded border border-slate-300 p-2"
          placeholder="Postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          onFocus={() => { if (options.length) setOpen(true); }}
          required={required}
          autoComplete="postal-code"
        />

        {/* Line 1 with dropdown */}
        <div className="col-span-3 relative" ref={boxRef}>
          <input
            className="w-full rounded border border-slate-300 p-2"
            placeholder="Address line 1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({ ...value, line1: e.target.value });
            }}
            onFocus={() => { if (options.length) setOpen(true); }}
            autoComplete="address-line1"
            required={required}
          />
          {/* dropdown */}
          {open && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow">
              {loading && <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>}
              {!loading && options.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">No results</div>
              )}
              {!loading &&
                options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(opt.line1);
                      onChange(opt); // fill all split fields
                      setOpen(false);
                    }}
                  >
                    {[opt.line1, opt.line2, opt.city, opt.county, opt.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Line 2 */}
        <input
          className="col-span-5 rounded border border-slate-300 p-2"
          placeholder="Address line 2 (optional)"
          value={value.line2 ?? ""}
          onChange={(e) => onChange({ ...value, line2: e.target.value })}
          autoComplete="address-line2"
        />

        {/* City */}
        <input
          className="col-span-2 rounded border border-slate-300 p-2"
          placeholder="Town / City"
          value={value.city ?? ""}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          autoComplete="address-level2"
          required={required}
        />

        {/* County */}
        <input
          className="col-span-2 rounded border border-slate-300 p-2"
          placeholder="County"
          value={value.county ?? ""}
          onChange={(e) => onChange({ ...value, county: e.target.value })}
          autoComplete="address-level1"
        />

        {/* Mirror postcode (kept in sync) */}
        <input
          className="col-span-1 rounded border border-slate-300 p-2"
          placeholder="Postcode"
          value={value.postcode ?? ""}
          onChange={(e) => {
            setPostcode(e.target.value);
            onChange({ ...value, postcode: e.target.value.toUpperCase() });
          }}
          autoComplete="postal-code"
          required={required}
        />
      </div>
    </div>
  );
}
