import React from 'react';
import AddressSearch, { type AddressItem } from '@/components/address/AddressSearch';
import { fetchAddressDetail, mapDetail } from '@/lib/addressLookup';
import { formatUKPostcode } from '@/lib/ukPostcode';
import * as UI from '@/styles/ui';
import type { AddressValue } from '../types';

type AddressErrors = Partial<Record<keyof AddressValue, string>>;

type AddressPickerProps = {
  id: string;
  label: string;
  value: AddressValue | null;
  onChange: (value: AddressValue) => void;
  helpText?: string;
  required?: boolean;
  errors?: AddressErrors | null;
  describedBy?: string;
  footnote?: string;
};

export default function AddressPicker({
  id,
  label,
  value,
  onChange,
  helpText,
  required = true,
  errors,
  describedBy,
  footnote,
}: AddressPickerProps) {
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

  const helperId = helpText ? `${id}-helper` : undefined;
  const describedByIds = [helperId, describedBy].filter(Boolean).join(' ') || undefined;

  const fieldError = (field: keyof AddressValue): string | undefined => errors?.[field];
  const inputClass = (field: keyof AddressValue) =>
    `${UI.input} mt-1 w-full ${fieldError(field) ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-200' : ''}`;

  return (
    <fieldset className="space-y-3" id={id} aria-labelledby={`${id}-label`}>
      <legend id={`${id}-label`} className="text-sm font-semibold text-blue-900">
        {label}
      </legend>
      {helpText && (
        <p id={helperId} className="text-sm text-slate-600">
          {helpText}
        </p>
      )}
      <AddressSearch
        value={manual?.line1}
        onPick={handlePick}
        placeholder="Search for an address or postcode"
        describedBy={describedByIds}
        required={required}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-line1`}>
            Address line 1
          </label>
          <input
            id={`${id}-line1`}
            className={inputClass('line1')}
            value={manual?.line1 ?? ''}
            onChange={(event) => handleManualChange({ line1: event.target.value })}
            required={required}
            aria-invalid={fieldError('line1') ? 'true' : undefined}
            aria-describedby={fieldError('line1') ? `${id}-line1-error` : describedByIds}
          />
          {fieldError('line1') && (
            <p id={`${id}-line1-error`} className="mt-1 text-sm text-amber-700">
              {fieldError('line1')}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-line2`}>
            Address line 2 (optional)
          </label>
          <input
            id={`${id}-line2`}
            className={inputClass('line2')}
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
            className={inputClass('town')}
            value={manual?.town ?? ''}
            onChange={(event) => handleManualChange({ town: event.target.value })}
            aria-invalid={fieldError('town') ? 'true' : undefined}
            aria-describedby={fieldError('town') ? `${id}-town-error` : describedByIds}
          />
          {fieldError('town') && (
            <p id={`${id}-town-error`} className="mt-1 text-sm text-amber-700">
              {fieldError('town')}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`${id}-postcode`}>
            Postcode
          </label>
          <input
            id={`${id}-postcode`}
            className={`${inputClass('postcode')} uppercase`}
            value={manual?.postcode ?? ''}
            onChange={(event) => handleManualChange({ postcode: event.target.value.toUpperCase() })}
            required={required}
            aria-invalid={fieldError('postcode') ? 'true' : undefined}
            aria-describedby={fieldError('postcode') ? `${id}-postcode-error` : describedByIds}
          />
          {fieldError('postcode') && (
            <p id={`${id}-postcode-error`} className="mt-1 text-sm text-amber-700">
              {fieldError('postcode')}
            </p>
          )}
        </div>
      </div>
      {footnote && <p className="text-sm text-slate-600">{footnote}</p>}
    </fieldset>
  );
}
