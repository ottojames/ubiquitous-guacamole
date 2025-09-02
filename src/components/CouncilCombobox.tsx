import React from "react";
import AsyncCombobox from "./AsyncCombobox";

export interface CouncilOption {
  id: string;
  name: string;
  email?: string;
}

export default function CouncilCombobox({ onSelect }: { onSelect: (c: CouncilOption) => void }) {
  const fetchOptions = async (q: string) => {
    const res = await fetch(`/api/councils?query=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return res.json();
  };
  return (
    <AsyncCombobox<CouncilOption>
      label="Council Name"
      placeholder="Start typing a council…"
      fetchOptions={fetchOptions}
      onSelect={onSelect}
      getOptionLabel={(o) => o.name}
      getKey={(o) => o.id || o.name}
      required
      inputTestId="council-input"
    />
  );
}
