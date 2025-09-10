import React from 'react';

export default function PreviewPane({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 shadow-inner bg-slate-50 p-4">
      <div className="text-sm text-slate-600 mb-2">Preview (read‑only)</div>
      <pre
        className="whitespace-pre-wrap font-serif text-[15px] leading-7 text-justify bg-white p-4 rounded-lg border border-slate-200"
        aria-live="polite"
      >
        {text || '/* OCR or generated text will appear here */'}
      </pre>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="px-3 py-1 rounded bg-slate-800 text-white text-sm"
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy text
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded bg-slate-100 text-slate-800 text-sm"
          onClick={() => {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notice.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download .txt
        </button>
      </div>
    </div>
  );
}
