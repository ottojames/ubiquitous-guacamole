import React from 'react';

export default function CostCard({ cost }: { cost: number }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Cost">
      <h3 className="font-medium mb-2">Cost</h3>
      <div className="text-sm">£{cost.toFixed(2)}</div>
      <div className="text-xs text-slate-500">Includes notice generation, proof and hosting</div>
    </div>
  );
}
