import * as React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StepType() {
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Confirm Notice Type</h1>
      <p className="text-muted-foreground">Choose a category and subcategory (Licensing, Gambling, GVOL, Planning, Probate).</p>
      {/* TODO: Replace with real pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {['Licensing Act 2003','Gambling Act 2005','GVOL','Planning (Press)','Probate (s.27)'].map(x => (
          <button key={x} className="rounded-xl border px-4 py-3 text-left hover:bg-accent" type="button">
            <div className="font-medium">{x}</div>
            <div className="text-sm text-muted-foreground">Select this to continue</div>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => nav('/next/publish/upload')}>Continue</button>
      </div>
    </div>
  );
}
