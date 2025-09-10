import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function NoticePreview({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copyText = async () => {
    try {
      await navigator.clipboard?.writeText(text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
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
    <section
      id="notice-preview"
      className="mt-6 rounded-2xl border bg-white p-6 md:p-8 shadow-sm transition-all"
    >
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Preview (read-only)</h3>
      <article className="mx-auto max-w-[720px] font-serif text-[15px] leading-7 tracking-[0.003em] text-justify hyphens-auto">
        <pre className="whitespace-pre-wrap break-words">{text}</pre>
      </article>
      <div className="mt-6 flex justify-end gap-2">
        <button
          aria-label="Copy notice text"
          className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={copyText}
        >
          Copy
        </button>
        <button
          aria-label="Download notice text"
          className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={downloadTxt}
        >
          Download .txt
        </button>
      </div>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 rounded-md bg-slate-900 px-3 py-2 text-sm text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
