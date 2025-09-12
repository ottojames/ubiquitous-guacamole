import React from "react";
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
};

export default function AddressAutocomplete({ onSelect, label = "Premises Address", inputTestId = "address-input" }: { onSelect: (a: AddressOption) => void; label?: string; inputTestId?: string }) {
  const fetchOptions = async (q: string) => {
    const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const json = await res.json();
    const results = (json.results || []) as any[];
    // Map backend records into AddressOption shape with label for display
    return results.map((r) => ({
      id: String(r.id ?? r.label ?? r.postcode ?? Math.random()),
      label: r.label ?? [r.line1, r.city, r.postcode].filter(Boolean).join(", "),
      line1: r.line1 ?? r.lines?.[0],
      line2: r.line2 ?? r.lines?.[1],
      line3: r.line3 ?? r.lines?.[2],
      city: r.city ?? r.town,
      town: r.town,
      postcode: r.postcode,
      lines: r.lines,
    })) as AddressOption[];
  };
  return (
    <AsyncCombobox<AddressOption>
      label={label}
      placeholder="Start typing an address…"
      fetchOptions={fetchOptions}
      onSelect={onSelect}
      getOptionLabel={(o) => o.label || [o.line1, o.city ?? o.town, o.postcode].filter(Boolean).join(", ")}
      getKey={(o) => o.id || o.label || `${o.line1}-${o.postcode}`}
      required
      inputTestId={inputTestId}
    />
  );
}
