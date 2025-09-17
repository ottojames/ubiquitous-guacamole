"use client";

import type { ChangeEvent } from "react";
import UploadDropzone from "./UploadDropzone";

type UploadPanelProps = {
  noticeText: string;
  hasManualEdits: boolean;
  onEditorChange(text: string): void;
  onOcr(text: string): void;
};

export default function UploadPanel({
  noticeText,
  hasManualEdits,
  onEditorChange,
  onOcr,
}: UploadPanelProps) {
  const handleEditorChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onEditorChange(event.target.value);
  };

  return (
    <div className="space-y-6">
      <UploadDropzone onOcr={onOcr} />
      <div>
        <label htmlFor="notice-text" className="mb-2 block text-sm font-semibold">
          Notice text
        </label>
        <textarea
          id="notice-text"
          data-testid="notice-editor"
          value={noticeText}
          onChange={handleEditorChange}
          rows={12}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Paste your notice text or use OCR above."
        />
        <div className="mt-2 text-xs text-slate-600" role="status">
          {hasManualEdits ? "Manual edits in progress" : "No manual edits yet"}
        </div>
      </div>
    </div>
  );
}

