import React from "react";
import AsyncCombobox from "./AsyncCombobox";

export interface AddressOption {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  line3?: string;
  city?: string;
  postcode?: string;
}

export default function AddressAutocomplete({ onSelect }: { onSelect: (a: AddressOption) => void }) {
  const fetchOptions = async (q: string) => {
    const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  };
  return (
    <AsyncCombobox<AddressOption>
      label="Premises Address"
      placeholder="Start typing an address…"
      fetchOptions={fetchOptions}
      onSelect={onSelect}
      getOptionLabel={(o) => o.label}
      getKey={(o) => o.id || o.label}
      required
      inputTestId="address-input"
    />
  );
}
