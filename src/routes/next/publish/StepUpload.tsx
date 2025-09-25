import * as React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StepUpload() {
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload your Notice</h1>
      <div className="rounded-xl border p-4">
        {/* TODO: Move the existing "Upload from Notice / Upload via Template" tabs here in Step 2 */}
        <p className="text-muted-foreground">Tabs placeholder — to be wired in Step 2.</p>
      </div>
      <div className="flex justify-end">
        <button className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => nav('/next/publish/confirm')}>Continue</button>
      </div>
    </div>
  );
}
