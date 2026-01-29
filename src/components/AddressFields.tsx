import React from 'react';
import * as UI from '@/styles/ui';
import { formatUKPostcode } from '@/lib/ukPostcode';

export type AddressFieldsValue = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
};

type AddressFieldsProps = {
  value: AddressFieldsValue;
  onChange: (value: AddressFieldsValue) => void;
  label?: string;
  namePrefix?: string;
  required?: boolean;
  testIdPrefix?: string;
  line2Optional?: boolean;
};

export default function AddressFields({
  value,
  onChange,
  label = 'Address',
  namePrefix = 'address',
  required = true,
  testIdPrefix = 'address',
  line2Optional = true,
}: AddressFieldsProps) {
  const handleChange = (field: keyof AddressFieldsValue, rawValue: string) => {
    const newValue = field === 'postcode' ? formatUKPostcode(rawValue) : rawValue;
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className={`${UI.label} block`}>
          {label}
          {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <div>
        <label htmlFor={`${namePrefix}-line1`} className="block text-sm font-medium text-gray-900">
          Address line 1 <span className="text-rose-600">*</span>
        </label>
        <input
          id={`${namePrefix}-line1`}
          name={`${namePrefix}Line1`}
          className={UI.input}
          value={value.addressLine1 || ''}
          onChange={(e) => handleChange('addressLine1', e.target.value)}
          data-testid={`${testIdPrefix}-line1`}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor={`${namePrefix}-line2`} className="block text-sm font-medium text-gray-900">
          Address line 2{!line2Optional && <span className="text-rose-600">*</span>}
        </label>
        <input
          id={`${namePrefix}-line2`}
          name={`${namePrefix}Line2`}
          className={UI.input}
          value={value.addressLine2 || ''}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          data-testid={`${testIdPrefix}-line2`}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${namePrefix}-city`} className="block text-sm font-medium text-gray-900">
            Town/City <span className="text-rose-600">*</span>
          </label>
          <input
            id={`${namePrefix}-city`}
            name={`${namePrefix}City`}
            className={UI.input}
            value={value.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            data-testid={`${testIdPrefix}-city`}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={`${namePrefix}-postcode`} className="block text-sm font-medium text-gray-900">
            Postcode <span className="text-rose-600">*</span>
          </label>
          <input
            id={`${namePrefix}-postcode`}
            name={`${namePrefix}Postcode`}
            className={`${UI.input} uppercase`}
            value={value.postcode || ''}
            onChange={(e) => handleChange('postcode', e.target.value)}
            pattern="[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}"
            data-testid={`${testIdPrefix}-postcode`}
            autoComplete="off"
            inputMode="text"
          />
        </div>
      </div>
    </div>
  );
}
