import React from 'react';
import * as UI from '@/styles/ui';
import type { ChecklistItem } from '../ComplianceChecklist';

export default function ComplianceCard({ items, onFix }: { items: ChecklistItem[]; onFix?: (target?: string) => void }) {
  const unresolved = items.filter((i) => !i.ok);
  const allGood = unresolved.length === 0;

  const handleFix = (target?: string) => {
    if (onFix) onFix(target);
  };

  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Compliance checklist">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Compliance checklist</h3>
      <p className="sr-only" aria-live="polite">{unresolved.length} issues remaining</p>
      <div className="space-y-2.5">
        {allGood ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white text-[10px]">✔</span>
            All checks passed — ready to publish
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="grid grid-cols-[1fr_auto] items-start gap-3 py-1.5">
                <span className={`text-[13px] ${item.ok ? 'text-green-700' : 'text-slate-700'}`}>{item.label}</span>
                {!item.ok ? (
                  <button
                    type="button"
                    className="text-xs px-2 h-7 rounded-md ring-1 ring-blue-200/70 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
                    onClick={() => handleFix(item.target)}
                    data-field={item.id}
                  >
                    Fix this
                  </button>
                ) : (
                  <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[10px]">✔</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
