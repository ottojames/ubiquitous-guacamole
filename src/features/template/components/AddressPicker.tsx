import React from 'react';
import AddressSearch, { type AddressItem } from '@/components/address/AddressSearch';
import { fetchAddressDetail, mapDetail } from '@/lib/addressLookup';
import { formatUKPostcode } from '@/lib/ukPostcode';
import * as UI from '@/styles/ui';
import type { AddressValue } from '../types';

type AddressPickerProps = {
  id: string;
  label: string;
  value: AddressValue | null;
  onChange: (value: AddressValue) => void;
  helpText?: string;
  required?: boolean;
};

export default function AddressPicker({ id, label, value, onChange, helpText, required = true }: AddressPickerProps) {
  const [manual, setManual] = React.useState<AddressValue | null>(value ?? null);
  const handlePick = React.useCallback(
    (item: AddressItem) => {
      if (!item?.id) return;
      void fetchAddressDetail(item.id)
        .then((detail) => {
          const mapped = mapDetail(detail);
          const next: AddressValue = {
            line1: mapped.line1 || item.label,
            line2: mapped.line2 || '',
            town: mapped.town || '',
            postcode: formatUKPostcode(mapped.postcode || item.postcode || ''),
          };
          setManual(next);
          onChange(next);
        })
        .catch(() => {
          const fallback: AddressValue = {
            line1: item.label,
            line2: '',
            town: '',
            postcode: formatUKPostcode(item.postcode || ''),
          };
          setManual(fallback);
          onChange(fallback);
        });
    },
    [onChange]
  );

  const handleManualChange = (patch: Partial<AddressValue>) => {
    const next: AddressValue = {
      line1: patch.line1 ?? manual?.line1 ?? '',
      line2: patch.line2 ?? manual?.line2 ?? '',
      town: patch.town ?? manual?.town ?? '',
      postcode: patch.postcode ?? manual?.postcode ?? '',
    };
    setManual(next);
    onChange(next);
  };

  React.useEffect(() => {
    if (!value) return;
    setManual(value);
  }, [value?.line1, value?.line2, value?.town, value?.postcode]);

  return (
    <fieldset className="space-y-3" id={id} aria-labelledby={`${id}-label`}>
      <legend id={`${id}-label`} className="text-sm font-semibold text-blue-900">
        {label}
      </legend>
      {helpText && <p className="text-sm text-slate-600">{helpText}</p>}
      <AddressSearch
        value={manual?.line1}
        onPick={handlePick}
        placeholder="Search for an address or postcode"
        describedBy={`${id}-helper`}
        required={required}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-line1`}>
            Address line 1
          </label>
          <input
            id={`${id}-line1`}
            className={`${UI.input} mt-1 w-full`}
            value={manual?.line1 ?? ''}
            onChange={(event) => handleManualChange({ line1: event.target.value })}
            required={required}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-line2`}>
            Address line 2 (optional)
          </label>
          <input
            id={`${id}-line2`}
            className={`${UI.input} mt-1 w-full`}
            value={manual?.line2 ?? ''}
            onChange={(event) => handleManualChange({ line2: event.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-town`}>
            Town or city
          </label>
          <input
            id={`${id}-town`}
            className={`${UI.input} mt-1 w-full`}
            value={manual?.town ?? ''}
            onChange={(event) => handleManualChange({ town: event.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-postcode`}>
            Postcode
          </label>
          <input
            id={`${id}-postcode`}
            className={`${UI.input} mt-1 w-full uppercase`}
            value={manual?.postcode ?? ''}
            onChange={(event) => handleManualChange({ postcode: event.target.value.toUpperCase() })}
            required={required}
          />
        </div>
      </div>
    </fieldset>
  );
}
