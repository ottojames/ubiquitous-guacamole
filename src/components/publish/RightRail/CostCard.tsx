import React from 'react';
import * as UI from '@/styles/ui';

export default function CostCard({ cost, canSubmit }: { cost: number; canSubmit: boolean }) {
  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Cost">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Cost</h3>
      <div className="text-sm text-[#192650]">£{cost.toFixed(2)}</div>
      <div className="text-xs text-slate-700">Includes notice generation, proof and hosting</div>
      <button type="button" className={`${UI.btnPrimary} w-full mt-3`} disabled={!canSubmit}>
        Submit
      </button>
    </div>
  );
}
