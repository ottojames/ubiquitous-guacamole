import React from 'react';

export default function NoticePreview({ text }: { text: string }) {
  const copyText = () => navigator.clipboard?.writeText(text || '');
  const downloadTxt = () => {
    const blob = new Blob([text || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Preview (read-only)</h3>
      <article className="mx-auto max-w-[720px] font-serif text-[15px] leading-7 tracking-[0.003em] [text-align:justify] hyphens-auto">
        <pre className="whitespace-pre-wrap break-words">{text}</pre>
      </article>
      <div className="mt-4 flex gap-2">
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={copyText}>Copy</button>
        <button className="rounded-md border px-3 py-1.5 text-sm" onClick={downloadTxt}>Download .txt</button>
      </div>
    </section>
  );
}
