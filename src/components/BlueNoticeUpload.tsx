import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onOcrComplete: (text: string, meta: any) => void;
  engine?: string;
}

export default function BlueNoticeUpload({ value, onChange, onOcrComplete, engine }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      setStatus("uploading");
      setError("");
      const fd = new FormData();
      fd.append("file", accepted[0]);
      try {
        const res = await fetch("/api/upload/ocr", { method: "POST", body: fd });
        if (!res.ok) {
          const msg = await res.text();
          setError(msg || "Upload failed");
          setStatus("error");
          return;
        }
        const json = await res.json();
        onOcrComplete(json.text || "", json.meta || {});
        onChange(json.text || "");
        setStatus("idle");
      } catch (e: any) {
        setError("Upload failed");
        setStatus("error");
      }
    },
    [onChange, onOcrComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div>
      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${isDragActive ? "bg-slate-50" : ""}`,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">PDF, DOC, DOCX, PNG or JPG</div>
          <div>Drag & drop, or click to choose file</div>
        </div>
      </div>
      {status === "uploading" && <div className="mt-2 text-sm">Processing…</div>}
      {status === "error" && <div className="mt-2 text-sm text-rose-600">{error}</div>}
      <textarea
        data-testid="notice-editor"
        aria-label="Notice editor"
        className="mt-4 w-full h-64 border rounded p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 text-xs text-right text-slate-500">
        {wordCount} words
        {engine && value && ` — OCR complete via ${engine}`}
      </div>
    </div>
  );
}
