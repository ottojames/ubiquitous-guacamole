import React, { useMemo, useState } from 'react';
import * as UI from '@/styles/ui';
import { sanitiseNoticeText } from '@/lib/text/sanitiseNotice';

/* CN:STEP2-COMPLIANCE-UPGRADE-START */
export default function PreviewCard({ text, statusMessage }: { text: string; statusMessage?: string }) {
/* CN:STEP2-COMPLIANCE-UPGRADE-END */
  const [open, setOpen] = useState(false);
  const safeText = useMemo(() => sanitiseNoticeText(text || ''), [text]);
  const hasPreview = safeText.trim().length > 0;
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  const lines = useMemo(() => safeText.split(/\r?\n/), [safeText]);
  const h1 = lines[0]?.trim();
  const h2 = lines[1]?.trim();
  const body = lines.slice(2);

  const copy = async () => {
    try { await navigator.clipboard?.writeText(safeText || ''); } catch { /* noop */ }
  };
  const download = () => {
    const blob = new Blob([safeText || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'notice.txt'; a.click(); URL.revokeObjectURL(url);
  };
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  return (
    <div aria-label="Notice preview" className={`${UI.card} ${UI.cardHover} relative min-h-[360px] p-4 md:p-5 space-y-4`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
        <div>
          <h3 className="text-[13px] font-medium text-slate-700">Preview</h3>
          <p className="mt-1 text-xs text-slate-600">Generated as you type</p>
        </div>
        {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border px-2 py-1 text-xs text-[#192650] hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-600"
            onClick={copy}
            aria-label="Copy text"
          >
            Copy text
          </button>
          <button
            type="button"
            className="rounded-md border px-2 py-1 text-xs text-[#192650] hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-600"
            onClick={download}
            aria-label="Download .txt"
          >
            Download .txt
          </button>
          {/* expand */}
          <button
            type="button"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Expand preview"
            title="Expand preview"
            onClick={() => setOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M7.5 4H4a1 1 0 0 0-1 1v3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 16H16a1 1 0 0 0 1-1v-3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m11 4 5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m4 11 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
      </div>
      {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
      {statusMessage && (
        <div role="status" className="text-[12px] text-amber-900 bg-amber-50 rounded px-2 py-1 ring-1 ring-amber-200" data-testid="preview-status">
          {statusMessage}
        </div>
      )}
      {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
      <div
        id="notice-preview"
        className="min-h-[300px] rounded-xl border border-slate-900/5 bg-white p-4"
      >
        {hasPreview ? (
          <div className={UI.prose + ' prose-p:my-2'}>
            {h1 && <h4 className="mt-0 text-sm font-semibold tracking-wide text-[#192650]">{h1.toUpperCase()}</h4>}
            {h2 && <p className="-mt-2 text-[13px] font-medium text-slate-700">{h2}</p>}
            {body.map((ln, i) => (
              <p key={i} className="text-[14px] leading-6 text-slate-800 whitespace-pre-wrap">{ln}</p>
            ))}
          </div>
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
            <div className={UI.prose + ' whitespace-pre-wrap'}>{safeText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
