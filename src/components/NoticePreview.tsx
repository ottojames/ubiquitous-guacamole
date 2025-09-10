import React from 'react';

export default function NoticePreview({ text }: { text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* ignore */
    }
  };
  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-slate-800">
        {text}
      </pre>
      <div className="mt-3 flex gap-2">
        <button
          aria-label="Copy text"
          className="rounded-md border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={copy}
        >
          Copy text
        </button>
        <button
          aria-label="Download .txt"
          className="rounded-md border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={download}
        >
          Download .txt
        </button>
      </div>
    </section>
  );
}
