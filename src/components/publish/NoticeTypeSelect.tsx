import React from 'react';
import * as UI from '@/styles/ui';

export type NoticeType = 'premises' | 'traffic' | 'gvol';

interface Props {
  value: NoticeType | '';
  onChange: (t: NoticeType) => void;
  helperTextId?: string;
}

const options: { value: NoticeType; label: string }[] = [
  { value: 'premises', label: 'Premises Licence' },
  { value: 'gvol', label: 'Goods vehicle operator' },
  { value: 'traffic', label: 'Traffic notice' },
];

export default function NoticeTypeSelect({ value, onChange, helperTextId }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor="notice-type" className="block text-sm font-medium text-slate-700">
        What type of notice do you require?
      </label>
      <select
        id="notice-type"
        value={value}
        onChange={(e) => onChange(e.target.value as NoticeType)}
        className={`${UI.input} w-full bg-white text-[#0f172a] focus:ring-offset-transparent`}
        aria-describedby={helperTextId}
      >
        <option value="">Select an option</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
