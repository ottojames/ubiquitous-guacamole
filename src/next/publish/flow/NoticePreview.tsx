import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// The sanitizer has caused runtime errors — treat it as best-effort only.
import { sanitiseNoticeText } from "@/lib/text/sanitiseNotice";
import { renderHtmlFromText } from "@/next/publish/templates/engine";
import type { OCRHighlight } from "@/next/publish/flow/lib/legalDetails";

type Props = {
  text: string | null | undefined;
  highlights?: OCRHighlight[];
  activeHighlight?: string | null;
  onHighlightClick?: (key: string) => void;
};

export default function NoticePreview({ text, highlights, activeHighlight, onHighlightClick }: Props) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  // Always coerce to string first
  const input = typeof text === "string" ? text : "";

  // Best-effort sanitization — must never throw
  const safeText = useMemo(() => {
    if (highlights?.length) {
      return input;
    }
    try {
      const result = sanitiseNoticeText?.(input);
      return typeof result === "string" ? result : String(result ?? "");
    } catch {
      return input;
    }
  }, [input, highlights]);

  // Convert plain text with newlines to HTML with proper paragraph breaks
  const htmlText = useMemo(() => {
    if (!safeText) return "";
    try {
      return renderHtmlFromText(safeText);
    } catch {
      // Fallback: wrap in a single paragraph
      return `<p>${safeText}</p>`;
    }
  }, [safeText]);

  const isEmpty = !safeText.trim();

  const highlightRefs = React.useRef<Record<string, HTMLSpanElement | null>>({});

  React.useEffect(() => {
    if (!activeHighlight) return;
    if (typeof window === "undefined") return;
    const ref = highlightRefs.current[activeHighlight];
    if (!ref) return;
    ref.scrollIntoView({ behavior: "smooth", block: "center" });
    ref.classList.add("ring", "ring-2", "ring-blue-400");
    const timeout = window.setTimeout(() => {
      ref.classList.remove("ring", "ring-2", "ring-blue-400");
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [activeHighlight]);

  const segments = React.useMemo(() => {
    if (highlights?.length && highlights.length > 0) {
      const sorted = [...highlights].sort((a, b) => a.start - b.start);
      const output: React.ReactNode[] = [];
      let cursor = 0;
      sorted.forEach((highlight, index) => {
        if (highlight.start > cursor) {
          output.push(
            <React.Fragment key={`text-${index}-${cursor}`}>{safeText.slice(cursor, highlight.start)}</React.Fragment>
          );
        }
        const content = safeText.slice(highlight.start, highlight.end);
        output.push(
          <span
            key={`highlight-${highlight.key}-${index}`}
            ref={(node) => {
              if (!highlightRefs.current) highlightRefs.current = {};
              highlightRefs.current[highlight.key] = node;
            }}
            className="relative inline-block cursor-pointer rounded-md border border-slate-300 bg-slate-100 px-1 py-0.5 transition-all hover:bg-slate-200"
            data-field-key={highlight.key}
            onClick={() => onHighlightClick?.(highlight.key)}
            tabIndex={0}
            role="button"
            aria-label={highlight.label}
          >
            {content}
          </span>
        );
        cursor = highlight.end;
      });
      if (cursor < safeText.length) {
        output.push(<React.Fragment key={`tail-${cursor}`}>{safeText.slice(cursor)}</React.Fragment>);
      }
      return output;
    }
    // Highlight our [[missing:...]] placeholders, but never throw
    try {
      const parts = safeText.split(/(\[\[missing:[^\]]+\]\])/g);
      return parts.map((part, i) => {
        if (/^\[\[missing:[^\]]+\]\]$/.test(part)) {
          return (
            <span
              key={`missing-${i}`}
              className="rounded bg-rose-50 px-1 py-0.5 text-xs font-medium text-rose-600"
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={`text-${i}`}>{part}</React.Fragment>;
      });
    } catch {
      // Fallback: just show the text as-is
      return [safeText];
    }
  }, [safeText]);

  const copyText = async () => {
    try {
      await navigator.clipboard?.writeText(safeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([safeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notice.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProof = async () => {
    try {
      const data = new TextEncoder().encode(safeText);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const manifest = {
        hash: hashArray,
        generatedAt: new Date().toISOString(),
        length: safeText.length,
      };
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: "application/json",
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      const a = document.createElement("a");
      a.href = manifestUrl;
      a.download = "notice-manifest.json";
      a.click();
      URL.revokeObjectURL(manifestUrl);
    } catch {
      // Non-critical; ignore
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Copy text"
            title="Copy text"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={copyText}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            type="button"
            aria-label="Download .txt"
            title="Download as text file"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={downloadTxt}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            aria-label="Download proof manifest"
            title="Download cryptographic proof"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={downloadProof}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="hidden sm:inline">Proof</span>
          </button>
        </div>

        {/* Character count */}
        {!isEmpty && (
          <span className="text-xs text-slate-500">
            {safeText.length.toLocaleString()} characters
          </span>
        )}
      </div>

      {/* Preview content */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50/30 shadow-inner">
        <AnimatePresence mode="wait" initial={false}>
          {!isEmpty ? (
            <motion.div
              key={safeText}
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reduceMotion ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="notice-preview max-h-[600px] overflow-y-auto break-words bg-white p-4 font-sans text-[14px] leading-[1.6] text-slate-800 [overflow-wrap:anywhere] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 [&>p]:mb-4 [&>p:last-child]:mb-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: htmlText }}
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reduceMotion ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center"
            >
              <svg className="mb-3 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-600">No preview yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Complete the required fields to generate your notice preview
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy notification toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="fixed bottom-6 right-6 z-[500] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            role="status"
            aria-live="polite"
          >
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
