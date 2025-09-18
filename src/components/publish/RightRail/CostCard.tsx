import React from 'react';
import * as UI from '@/styles/ui';

/* CN:STEP2-COMPLIANCE-START */
type Props = { cost: number; canSubmit: boolean; label?: string };
export default function CostCard({ cost, canSubmit, label }: Props) {
/* CN:STEP2-COMPLIANCE-END */
  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Cost">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-blue-900">Cost</h3>
        <div className="text-sm text-[#192650]">£{cost.toFixed(2)}</div>
        <div className="text-xs text-slate-700">Includes notice generation, proof and hosting</div>
        {/* CN:STEP2-COMPLIANCE-START */}
        {label ? (
          <button
            type="button"
            className={`${UI.btnPrimary} w-full mt-4`}
            disabled={!canSubmit}
          >
            {label}
          </button>
        ) : null}
        {/* CN:STEP2-COMPLIANCE-END */}
      </div>
    </div>
  );
}
