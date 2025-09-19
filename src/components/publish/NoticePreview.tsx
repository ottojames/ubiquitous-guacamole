import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { sanitiseNoticeText } from '@/lib/text/sanitiseNotice';

export default function NoticePreview({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const safeText = React.useMemo(() => sanitiseNoticeText(text || ''), [text]);
  const isEmpty = !safeText.trim();
  const segments = React.useMemo(() => {
    const parts = safeText.split(/(\[\[missing:[^\]]+\]\])/g);
    return parts.map((part, index) => {
      if (/^\[\[missing:[^\]]+\]\]$/.test(part)) {
        return (
          <span
            key={`missing-${index}`}
            className="rounded bg-rose-50 px-1 py-0.5 text-xs font-medium text-rose-600"
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  }, [safeText]);
  const copyText = async () => {
    try {
      await navigator.clipboard?.writeText(safeText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  const downloadTxt = () => {
    const blob = new Blob([safeText || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProof = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(safeText || '');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const manifest = {
      hash: hashArray,
      generatedAt: new Date().toISOString(),
      length: safeText.length,
    };
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    const a = document.createElement('a');
    a.href = manifestUrl;
    a.download = 'notice-manifest.json';
    a.click();
    URL.revokeObjectURL(manifestUrl);
  };

  return (
    <section
      id="notice-preview"
      className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm"
    >
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Notice preview</h3>
      <AnimatePresence mode="wait" initial={false}>
        {!isEmpty ? (
          <motion.pre
            key={safeText}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="notice-preview max-h-[70vh] overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-mono text-sm leading-relaxed"
          >
            {segments}
          </motion.pre>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="flex min-h-[160px] items-center justify-center rounded-xl bg-gray-50 px-4 text-center text-sm text-slate-500"
          >
            Your preview will appear here after you upload or type your notice text.
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6 flex justify-end gap-2">
        <button
          aria-label="Copy text"
          className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          onClick={copyText}
        >
          Copy text
        </button>
        <button
          aria-label="Download .txt"
          className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          onClick={downloadTxt}
        >
          Download .txt
        </button>
        <button
          aria-label="Download proof manifest"
          className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          onClick={downloadProof}
        >
          Proof
        </button>
      </div>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
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
