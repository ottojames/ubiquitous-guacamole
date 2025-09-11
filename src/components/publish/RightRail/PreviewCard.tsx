import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function PreviewCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div aria-label="Notice preview">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">Preview</h3>
        <button type="button" className="text-sm underline" onClick={() => setOpen(true)}>
          Expand
        </button>
      </div>
      <div className={`${UI.prose} whitespace-pre-wrap min-h-[420px]`} id="notice-preview">
        {text}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={UI.card + ' max-w-3xl w-full h-full md:h-auto md:max-h-[90vh] p-6 md:p-8 overflow-auto'}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className={UI.h2}>Notice preview</h4>
              <button onClick={() => setOpen(false)} aria-label="Close" className={UI.ghostPill}>
                Close
              </button>
            </div>
            <div className={`${UI.prose} whitespace-pre-wrap text-base md:text-lg`}>{text}</div>
          </div>
        </div>
      )}
    </div>
  );
}
