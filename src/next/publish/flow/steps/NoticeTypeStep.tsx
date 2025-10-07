import React from 'react';
import * as UI from '@/styles/ui';
import { NOTICE_CATEGORY_TREE, type NoticeDefinition } from '@/next/publish/config/noticeTypes';

export type NoticeTypeStepProps = {
  selectedId: string | null;
  onSelect: (id: string, definition: NoticeDefinition) => void;
  onContinue: () => void;
};

export default function NoticeTypeStep({ selectedId, onSelect, onContinue }: NoticeTypeStepProps) {
  return (
    <section className={`${UI.card} p-6 space-y-6`} data-testid="notice-step">
      <div>
        <h2 className="text-base font-semibold text-brand-navy">Step 1 · Confirm notice type</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Choose the exact legislation and variation. This controls validation, templates, and payment.
        </p>
      </div>
      <div className="space-y-6" role="radiogroup" aria-label="Notice categories">
        {NOTICE_CATEGORY_TREE.map((category) => (
          <div key={category.id} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-wide">
                {category.label}
              </h3>
              <div className="mt-1 h-px w-full bg-neutral-200" aria-hidden="true" />
            </div>
            {category.groups.map((group) => (
              <div key={group.label} className="space-y-3">
                <p className="text-sm font-medium text-neutral-700">{group.label}</p>
                <div className="grid gap-3 sm:grid-cols-2" data-testid={`group-${category.id}-${group.label}`}>
                  {group.variants.map((variant) => {
                    const isSelected = variant.id === selectedId;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onSelect(variant.id, variant.definition)}
                        className={`rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue text-left p-4 ${
                          isSelected
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-navy shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-800 hover:border-brand-blue/40 hover:bg-brand-blue/5'
                        }`}
                        data-testid={`notice-option-${variant.id}`}
                      >
                        <span className="block text-sm font-semibold">{variant.label}</span>
                        <span className="mt-1 block text-xs text-neutral-600">
                          {category.label} · {variant.variant}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          className={`${UI.btnPrimary} min-w-[150px]`}
          onClick={onContinue}
          disabled={!selectedId}
          data-testid="notice-step-continue"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
