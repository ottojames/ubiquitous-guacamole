import React from 'react';

export default function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const percent = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1 text-slate-800">
        <span>Upload your Notice</span>
        <span>Confirm your Notice</span>
        <span>Pay</span>
      </div>
      <div className="h-1 bg-slate-200">
        <div className="h-1 bg-blue-600" style={{ width: percent }} />
      </div>
    </div>
  );
}
