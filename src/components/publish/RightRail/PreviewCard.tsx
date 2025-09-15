import React, { useState } from 'react';
import * as UI from '@/styles/ui';

export default function PreviewCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const hasPreview = (text ?? '').trim().length > 0;
  return (
    <div aria-label="Notice preview" className={`${UI.card} ${UI.cardHover} relative min-h-[360px] p-4 md:p-5 space-y-4`}>
      <div>
        <h3 className="font-medium text-brand-navy">Preview</h3>
        <p className="mt-1 text-xs text-slate-600">Generated as you type</p>
      </div>
      <button
        type="button"
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-600"
        aria-label="Expand preview"
        title="Expand preview"
        onClick={() => setOpen(true)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M7.5 4H4a1 1 0 0 0-1 1v3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 16H16a1 1 0 0 0 1-1v-3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m11 4 5 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m4 11 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        id="notice-preview"
        className="min-h-[300px] rounded-xl border border-slate-900/5 bg-white/80 p-4"
      >
        {hasPreview ? (
          <pre className="whitespace-pre-wrap text-[13px] leading-5 text-slate-800">{text}</pre>
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-slate-200/70" />
            <div className="h-3 w-11/12 rounded bg-slate-200/70" />
            <div className="h-3 w-9/12 rounded bg-slate-200/70" />
            <div className="h-3 w-7/12 rounded bg-slate-200/70" />
          </div>
        )}
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
