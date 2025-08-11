import React from 'react';

export type NoticeType = 'premises' | 'traffic' | 'gambling';

interface Props {
  value: NoticeType | '';
  onChange: (t: NoticeType) => void;
}

const options: { value: NoticeType; label: string }[] = [
  { value: 'premises', label: 'Premises licence' },
  { value: 'traffic', label: 'Traffic notice' },
  { value: 'gambling', label: 'Gambling licence' },
];

export default function NoticeTypeSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor="notice-type" className="block text-sm font-medium text-slate-700">
        What type of notice do you require?
      </label>
      <select
        id="notice-type"
        value={value}
        onChange={(e) => onChange(e.target.value as NoticeType)}
        className="w-full rounded border border-slate-300 p-2 bg-white"
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
