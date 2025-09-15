import React from 'react';
import * as UI from '@/styles/ui';
import type { ChecklistItem } from '../ComplianceChecklist';

export default function ComplianceCard({ items, onFix }: { items: ChecklistItem[]; onFix?: (target?: string) => void }) {
  const unresolved = items.filter((i) => !i.ok);
  const allGood = unresolved.length === 0;

  const handleFix = (target?: string) => {
    if (onFix) onFix(target);
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
    { key: 'Applicant', label: 'Applicant' },
    { key: 'Council', label: 'Council' },
    { key: 'Dates', label: 'Dates' },
    { key: 'Other', label: 'Other checks' },
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
          <div className="space-y-3">
            {orderedGroups.map((group, idx) => (
              <div key={group.key} className={idx === 0 ? '' : 'pt-1'}>
                <h4
                  className={`text-[11px] font-semibold uppercase tracking-wide text-slate-600 ${idx === 0 ? 'mt-0' : 'mt-2'} mb-1`}
                >
                  {group.label}
                </h4>
                <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2">
                  {grouped[group.key]?.map((item) => (
                    <React.Fragment key={item.id}>
                      <span
                        className={`text-[13px] leading-5 ${item.ok ? 'text-green-700' : 'text-slate-700'}`}
                      >
                        {item.label}
                      </span>
                      {item.ok ? (
                        <span
                          aria-hidden
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[10px]"
                        >
                          ✔
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-md border border-blue-200/70 bg-white px-3 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
                          onClick={() => handleFix(item.target)}
                          data-field={item.id}
                        >
                          Fix this
                        </button>
                      )}
                    </React.Fragment>
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
