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

function toOption(item: AddressItem): AddressOption {
  const baseLines = [item.line1, item.line2, item.town]
    .map((segment) => (segment ?? '').trim())
    .filter(Boolean);
  const fallbackLines = item.label
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const lines = baseLines.length ? baseLines : fallbackLines;

  // Only use item.postcode if it exists - don't try to extract from label
  // as normalizeUKPostcode just formats, it doesn't extract
  const postcode = (item.postcode ?? '').trim() || '';

  return mapAddress({
    id: item.id,
    label: item.label,
    line1: baseLines[0] ?? item.line1 ?? undefined,
    line2: baseLines[1] ?? item.line2 ?? undefined,
    town: item.town ?? fallbackLines[fallbackLines.length - 2] ?? undefined,
    city: item.town ?? undefined,
    postcode,
    lines,
    uprn: item.uprn ?? undefined,
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
      console.log('[AddressAutocomplete] handlePick called with item:', item);

      // If we have a postcode already, use the item directly
      if (item.postcode) {
        console.log('[AddressAutocomplete] Item has postcode, using directly');
        const option = toOption(item);
        console.log('[AddressAutocomplete] Created option:', option);
        setSelected(option);
        onSelect(option);
        return;
      }

      // Otherwise, fetch full address details to get the postcode
      console.log('[AddressAutocomplete] No postcode, fetching details for ID:', item.id);
      try {
        const { fetchAddressDetail, mapDetail } = await import('@/lib/addressLookup');
        const detailJson = await fetchAddressDetail(item.id);
        console.log('[AddressAutocomplete] Fetched detail JSON:', detailJson);
        const detail = mapDetail(detailJson);
        console.log('[AddressAutocomplete] Mapped detail:', detail);

        // Create an enhanced option with the full details including postcode
        const enhancedOption = toOption({
          ...item,
          postcode: detail.postcode || '',
          line1: detail.line1 || item.line1,
          line2: detail.line2 || item.line2,
          town: detail.town || item.town,
        });

        console.log('[AddressAutocomplete] Enhanced option:', enhancedOption);
        setSelected(enhancedOption);
        onSelect(enhancedOption);
      } catch (error) {
        console.error('[AddressAutocomplete] Failed to fetch address details:', error);
        // Fallback: Try to extract postcode from label if available
        const { extractUKPostcode } = await import('@/lib/ukPostcode');
        const extractedPostcode = extractUKPostcode(item.label || '');
        console.log('[AddressAutocomplete] Extracted postcode from label:', extractedPostcode);

        const option = toOption({
          ...item,
          postcode: extractedPostcode || '',
        });
        console.log('[AddressAutocomplete] Fallback option (with extraction):', option);
        setSelected(option);
        onSelect(option);
      }
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
