import React, { useMemo, useState } from 'react';
import * as UI from '@/styles/ui';
import type { TemplateNoticeType } from '../types';
import { useTemplateNoticeType, useTemplateStep } from '../TemplateBuilderProvider';

const OPTIONS: Array<{
  value: TemplateNoticeType;
  title: string;
  description: string;
  guidance: string;
}> = [
  {
    value: 'new',
    title: 'New premises licence',
    description: 'Start a new licence for alcohol, entertainment, or late night refreshment.',
    guidance: 'Use this when no premises licence exists yet.',
  },
  {
    value: 'variation',
    title: 'Variation to an existing licence',
    description: 'Change your existing licence (hours, layout, conditions).',
    guidance: 'Pick this when altering what is already permitted.',
  },
  {
    value: 'review',
    title: 'Review of a premises licence',
    description: 'Submit a review application (by the licence holder or responsible authority).',
    guidance: 'Use this when asking the council to review an existing licence.',
  },
];

export default function StepType() {
  const [selected, setSelected] = useTemplateNoticeType();
  const [, setStep] = useTemplateStep();
  const [touched, setTouched] = useState(false);

  const helperText = useMemo(() => {
    const option = OPTIONS.find((opt) => opt.value === selected);
    return option?.guidance ?? 'Select a notice type to continue.';
  }, [selected]);

  const handleContinue = () => {
    if (!selected) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep(2);
  };

  return (
    <section className={`${UI.card} p-5 md:p-6`} aria-labelledby="template-step-type-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="template-step-type-heading" className="text-base font-semibold text-blue-900">
            Confirm notice type
          </h2>
          <p id="template-step-type-helper" className="mt-1 text-sm text-slate-600">
            {helperText}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {OPTIONS.map((option) => {
          const isSelected = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              className={`group flex h-full flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-[0_8px_18px_rgba(37,99,235,0.15)]'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-[0_8px_18px_rgba(25,38,80,0.08)]'
              }`}
              aria-pressed={isSelected}
              aria-describedby={`template-type-desc-${option.value}`}
              onClick={() => {
                setSelected(option.value);
                setTouched(false);
              }}
            >
              <div className="space-y-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 text-sm font-semibold text-blue-700">
                  {isSelected ? '✔' : 'i'}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-blue-900">{option.title}</h3>
                  <p id={`template-type-desc-${option.value}`} className="mt-1 text-sm text-slate-600">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-xs font-medium text-blue-700">Read guidance →</div>
            </button>
          );
        })}
      </div>
      {touched && !selected && (
        <p className="mt-4 text-sm text-amber-700" role="alert">
          Select a notice type before continuing.
        </p>
      )}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          className={`${UI.btnPrimary} h-11 px-6 text-sm`}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
