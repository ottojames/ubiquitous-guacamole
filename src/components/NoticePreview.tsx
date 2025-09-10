import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface NoticePreviewProps {
  text: string;
}

export default function NoticePreview({ text }: NoticePreviewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section
        id="notice-preview"
        data-testid="notice-editor"
        className="mx-auto mt-6 max-w-[720px] rounded-2xl border bg-white/50 p-6 shadow-sm md:p-8"
      >
        <div className="mb-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy text to clipboard"
            className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download text as .txt file"
            className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Download .txt
          </button>
        </div>
        <article className="font-serif text-[15px] leading-7 tracking-[0.003em] text-justify hyphens-auto whitespace-pre-wrap">
          {text}
        </article>
      </section>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 rounded-md bg-slate-800 px-3 py-2 text-sm text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
