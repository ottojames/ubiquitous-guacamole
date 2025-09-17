import React from 'react';
import AddressSearch, { type AddressItem } from './address/AddressSearch';
import { normalizeUKPostcode } from '@/lib/text/extract';
import * as UI from '@/styles/ui';

export type AddressOption = {
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  town?: string;
  postcode?: string;
  lines?: string[];
  uprn?: string;
  id?: string;
  label?: string;
};

export function mapAddress(raw: any): AddressOption {
  const lines: string[] = Array.isArray(raw?.lines)
    ? raw.lines.filter((line: string) => typeof line === 'string' && line.trim())
    : [raw?.line1 ?? raw?.line_1, raw?.line2 ?? raw?.line_2, raw?.line3 ?? raw?.line_3]
        .map((line) => (typeof line === 'string' ? line.trim() : ''))
        .filter(Boolean);

  const line1 = lines[0] ?? '';
  const line2 = lines[1] ?? '';
  const line3 = lines[2] ?? '';
  const city = raw?.city ?? raw?.town ?? raw?.post_town ?? raw?.dependent_locality ?? '';
  const postcode = raw?.postcode ?? raw?.post_code ?? normalizeUKPostcode(raw?.label ?? '') ?? '';
  const label =
    raw?.label ||
    [line1, line2 || city, postcode].filter(Boolean).join(', ');

  return {
    id: String(raw?.id ?? raw?.uprn ?? raw?.udprn ?? label ?? Math.random()),
    label,
    line1,
    line2,
    line3,
    city: city || raw?.dependent_locality || '',
    town: raw?.town ?? city,
    postcode,
    lines: lines.length ? lines : undefined,
    uprn: raw?.uprn ?? raw?.udprn ?? raw?.id ?? '',
  };
}

async function resolveOption(item: AddressItem): Promise<AddressOption> {
  try {
    const response = await fetch(`/api/address/resolve?id=${encodeURIComponent(item.id)}`);
    if (response.ok) {
      const payload = await response.json();
      if (payload?.address) {
        return mapAddress({ ...payload.address, label: item.label, id: item.id });
      }
    }
  } catch (error) {
    console.warn('[addresses] resolve option failed', error);
  }

  const fallbackLines = item.label
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  return mapAddress({
    id: item.id,
    label: item.label,
    lines: fallbackLines,
    postcode: normalizeUKPostcode(item.label) || '',
  });
}

export default function AddressAutocomplete({
  onSelect,
  label = 'Premises Address',
  inputTestId = 'address-input',
}: {
  onSelect: (option: AddressOption) => void;
  label?: string;
  inputTestId?: string;
}) {
  const helperId = React.useId();
  const name = React.useId().replace(/:/g, '');
  const [selected, setSelected] = React.useState<AddressOption | null>(null);

  const handleCommit = React.useCallback(() => {
    setSelected(null);
  }, []);

  const handlePick = React.useCallback(
    async (item: AddressItem) => {
      const option = await resolveOption(item);
      setSelected(option);
      onSelect(option);
    },
    [onSelect]
  );

  return (
    <div className="w-full">
      <label htmlFor={name} className={`${UI.label}`}>
        {label}
        <span className="text-rose-600">*</span>
      </label>
      <AddressSearch
        name={name}
        required
        onChange={handleCommit}
        onPick={handlePick}
        inputTestId={inputTestId}
        describedBy={helperId}
      />
      <p id={helperId} className="mt-1 text-xs text-neutral-500">
        Start typing to look up the address and pre-fill details.
      </p>
      {selected?.uprn && (
        <div
          data-testid="uprn-chip"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
        >
          <span className="font-medium">UPRN</span>
          <span>{selected.uprn}</span>
        </div>
      )}
    </div>
  );
}
