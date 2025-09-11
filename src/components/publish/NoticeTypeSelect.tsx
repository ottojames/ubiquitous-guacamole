import React from 'react';
import * as UI from '@/styles/ui';

export type NoticeType = 'premises' | 'traffic' | 'gvol';

interface Props {
  value: NoticeType | '';
  onChange: (t: NoticeType) => void;
}

const options: { value: NoticeType; label: string }[] = [
  { value: 'premises', label: 'Premises Licence' },
  { value: 'gvol', label: 'Goods vehicle operator' },
  { value: 'traffic', label: 'Traffic notice' },
];

export default function NoticeTypeSelect({ value, onChange }: Props) {
  return (
    <select
      id="notice-type"
      value={value}
      onChange={(e) => onChange(e.target.value as NoticeType)}
      className={UI.input + ' w-full'}
    >
      <option value="">Select an option</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
