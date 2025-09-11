import React from 'react';
import * as UI from '@/styles/ui';

export default function CostCard({ cost, canSubmit }: { cost: number; canSubmit: boolean }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Cost">
      <h3 className="font-medium mb-2">Cost</h3>
      <div className="text-sm">£{cost.toFixed(2)}</div>
      <div className="text-xs text-slate-500">Includes notice generation, proof and hosting</div>
      <button type="button" className={UI.pillBtn + ' w-full mt-3'} disabled={!canSubmit}>
        Submit
      </button>
    </div>
  );
}
