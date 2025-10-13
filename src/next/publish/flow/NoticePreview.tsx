import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// The sanitizer has caused runtime errors — treat it as best-effort only.
import { sanitiseNoticeText } from "@/lib/text/sanitiseNotice";
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
        const labelId = `field-label-${highlight.key}-${index}`;
        const content = safeText.slice(highlight.start, highlight.end);
        const tone =
          highlight.confidence != null && highlight.confidence >= 0.8
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200";
        output.push(
          <span
            key={`highlight-${highlight.key}-${index}`}
            ref={(node) => {
              if (!highlightRefs.current) highlightRefs.current = {};
              highlightRefs.current[highlight.key] = node;
            }}
            className="relative inline-block cursor-pointer rounded-md border border-slate-200 bg-yellow-50 px-1 py-0.5"
            data-field-key={highlight.key}
            onClick={() => onHighlightClick?.(highlight.key)}
            tabIndex={0}
            role="button"
            aria-labelledby={labelId}
          >
            <span
              id={labelId}
              className={`absolute -top-6 left-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
            >
              {highlight.label}
              {highlight.confidence != null ? `${Math.round(highlight.confidence * 100)}%` : null}
            </span>
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
    <section id="notice-preview" className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm">
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
