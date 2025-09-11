import React, { useState } from "react";
import AsyncCombobox from "./AsyncCombobox";

// Broader type to satisfy page contract while keeping compat with combobox
export type AddressOption = {
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  town?: string;
  postcode?: string;
  lines?: string[];
  // internal fields used by AsyncCombobox rendering
  id?: string;
  label?: string;
  uprn?: string;
};

export function mapAddress(r: any): AddressOption {
  return {
    id: String(r.id ?? r.label ?? r.postcode ?? Math.random()),
    label: r.label ?? [r.line1, r.city, r.postcode].filter(Boolean).join(", "),
    line1: r.line1 ?? r.lines?.[0],
    line2: r.line2 ?? r.lines?.[1],
    line3: r.line3 ?? r.lines?.[2],
    city: r.city ?? r.town,
    town: r.town,
    postcode: r.postcode,
    uprn: r.uprn || r.UPRN,
    lines: r.lines,
  };
}

export default function AddressAutocomplete({ onSelect, label = "Premises Address" }: { onSelect: (a: AddressOption) => void; label?: string }) {
  const [selected, setSelected] = useState<AddressOption | null>(null);

  const fetchOptions = async (q: string) => {
    const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const json = await res.json();
    const results = (json.results || []) as any[];
    // Map backend records into AddressOption shape with label for display
    return results.map(mapAddress) as AddressOption[];
  };
  return (
    <div>
      <AsyncCombobox<AddressOption>
        label={label}
        placeholder="Start typing an address…"
        fetchOptions={fetchOptions}
        onSelect={(opt) => {
          setSelected(opt);
          onSelect(opt);
        }}
        getOptionLabel={(o) =>
          o.label || [o.line1, o.city ?? o.town, o.postcode].filter(Boolean).join(", ")
        }
        getKey={(o) => o.id || o.label || `${o.line1}-${o.postcode}`}
        required
        inputTestId="address-input"
      />
      {selected?.uprn && (
        <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-800" data-testid="uprn-chip">
          UPRN saved
        </span>
      )}
    </div>
  );
}
