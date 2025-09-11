import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function PreviewCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div aria-label="Notice preview" className={UI.card + ' p-4'}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-brand-navy">Preview</h3>
        <button
          type="button"
          className="text-sm underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          onClick={() => setOpen(true)}
        >
          Expand
        </button>
      </div>
      <div className={UI.prose + ' whitespace-pre-wrap min-h-[420px]'} id="notice-preview">
        {text}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={UI.card + ' max-w-3xl w-full h-full md:h-auto md:max-h-[90vh] p-6 overflow-auto'}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className={UI.h2}>Notice preview</h4>
              <button onClick={() => setOpen(false)} aria-label="Close" className={UI.ghostPill}>
                Close
              </button>
            </div>
            <div className={UI.prose + ' whitespace-pre-wrap'}>{text}</div>
          </div>
        </div>
      )}
    </div>
  );
}
