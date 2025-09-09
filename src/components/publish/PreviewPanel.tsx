import React from "react";

export default function PreviewPanel({
  value,
  onCopy,
  onDownloadPdf,
  title = "Preview (Read-only)",
}: {
  value: string;
  onCopy: () => void;
  onDownloadPdf: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-xl border bg-white/95 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onCopy} className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50">
            Copy to clipboard
          </button>
          <button type="button" onClick={onDownloadPdf} className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50">
            Download proof PDF (draft)
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap text-sm font-mono border rounded p-3 bg-slate-50 max-h-[320px] overflow-auto">
        {value || "— Preview will appear here —"}
      </pre>
    </div>
  );
}
