import React from 'react';
import * as UI from '@/styles/ui';

/* CN:STEP2-COMPLIANCE-START */
type Props = { cost: number; canSubmit: boolean; label?: string };
export default function CostCard({ cost, canSubmit, label = 'Submit' }: Props) {
/* CN:STEP2-COMPLIANCE-END */
  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Cost">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Cost</h3>
      <div className="text-sm text-[#192650]">£{cost.toFixed(2)}</div>
      <div className="text-xs text-slate-700">Includes notice generation, proof and hosting</div>
      {/* CN:STEP2-COMPLIANCE-START */}
      <button type="button" className={`${UI.btnPrimary} w-full mt-3`} disabled={!canSubmit}>
        {label}
      </button>
      {/* CN:STEP2-COMPLIANCE-END */}
    </div>
  );
}
