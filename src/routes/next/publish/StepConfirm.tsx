import * as React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StepConfirm() {
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Confirm your Notice</h1>
      <p className="text-muted-foreground">Preview placeholder (typography to match Upload-from-Notice).</p>
      {/* IMPORTANT: Only one primary CTA on this page (no duplicate right-rail CTA) */}
      <div className="flex justify-end">
        <button className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => nav('/next/publish/pay')}>Continue to payment</button>
      </div>
    </div>
  );
}
