import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function PreviewCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div aria-label="Notice preview" className={`${UI.card} ${UI.cardHover} p-4 md:p-5 min-h-[360px] space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-brand-navy">Preview</h3>
        <button
          type="button"
          className="text-sm underline transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white"
          onClick={() => setOpen(true)}
        >
          Expand
        </button>
      </div>
      <p className="text-xs text-slate-600">Generated as you type</p>
      <div className={UI.prose + ' whitespace-pre-wrap min-h-[300px]'} id="notice-preview">
        {text}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${UI.card} max-w-3xl w-full h-full md:h-auto md:max-h-[90vh] p-6 overflow-auto`}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className={UI.h2}>Notice preview</h4>
              <button onClick={() => setOpen(false)} aria-label="Close" className={UI.btnSecondary}>
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
