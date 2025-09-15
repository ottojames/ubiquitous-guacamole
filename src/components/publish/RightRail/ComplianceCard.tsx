import React from 'react';
import * as UI from '@/styles/ui';
import type { ChecklistItem } from '../ComplianceChecklist';

export default function ComplianceCard({ items, onFix }: { items: ChecklistItem[]; onFix?: (target?: string) => void }) {
  const unresolved = items.filter((i) => !i.ok);
  const allGood = unresolved.length === 0;

  const handleFix = (target?: string) => {
    if (onFix) {
      onFix(target);
      return;
    }
    if (!target) return;
    const el = document.getElementById(target);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
  };

  const groupForLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('applicant')) return 'Applicant';
    if (lower.includes('council')) return 'Council';
    if (lower.includes('date') || lower.includes('deadline')) return 'Dates';
    return 'Other';
  };

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const key = groupForLabel(item.label);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const orderedGroups = [
    { key: 'Applicant', label: 'APPLICANT' },
    { key: 'Council', label: 'COUNCIL' },
    { key: 'Dates', label: 'DATES' },
    { key: 'Other', label: 'OTHER CHECKS' },
  ].filter((group) => grouped[group.key]?.length);

  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Compliance checklist">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Compliance checklist</h3>
      <p className="sr-only" role="status" aria-live="polite">
        {unresolved.length} issues remaining
      </p>
      <div className="space-y-4">
        {allGood ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white text-[10px]">✔</span>
            All checks passed — ready to publish
          </div>
        ) : (
          <div className="space-y-4">
            {orderedGroups.map((group) => (
              <div key={group.key}>
                <h4 className="text-[11px] tracking-wide uppercase text-slate-500 mb-2">{group.label}</h4>
                <div className="space-y-1">
                  {grouped[group.key]?.map((item) => (
                    <div key={item.id} className="flex items-center py-1.5">
                      <span
                        className={`flex-1 text-sm leading-5 ${item.ok ? 'text-emerald-700' : 'text-slate-800'}`}
                      >
                        {item.label}
                      </span>
                      {item.ok ? (
                        <span
                          aria-hidden
                          className="inline-flex h-6 w-[64px] items-center justify-end text-emerald-600"
                        >
                          ✔
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex h-9 w-[64px] items-center justify-end text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white"
                          onClick={() => handleFix(item.target)}
                          data-field={item.id}
                          aria-controls={item.target}
                        >
                          Fix this
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
