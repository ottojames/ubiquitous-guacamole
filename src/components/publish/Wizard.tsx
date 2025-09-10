import React from 'react';

type Props = {
  steps: string[];
  current: number;
  onStep?: (i: number) => void;
  onSaveDraft?: () => void;
};

export default function Wizard({ steps, current, onStep, onSaveDraft }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <ol className="flex flex-wrap gap-2" aria-label="Steps">
        {steps.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onStep?.(i)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                current === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-current={current === i}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="text-sm text-slate-600 hover:text-slate-900 underline"
        onClick={onSaveDraft}
      >
        Save draft
      </button>
    </div>
  );
}

