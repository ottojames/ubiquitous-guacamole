import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadBlueNotice } from "../lib/storage";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  path: string;
  publicUrl: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onOcrComplete: (text: string, meta: any) => void;
  engine?: string;
  onUploaded?: (files: UploadedFile[]) => void;
}

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function BlueNoticeUpload({
  value,
  onChange,
  onOcrComplete,
  engine,
  onUploaded,
}: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      const file = accepted[0];
      setCurrentFile(file);
      setError("");

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatus("error");
        setError("Unsupported file. Allowed: PDF, PNG, JPG, TXT, RTF, DOC, DOCX");
        return;
      }
      if (file.size > MAX_SIZE) {
        setStatus("error");
        setError("File must be 10 MB or less");
        return;
      }

      setStatus("uploading");
      try {
        // 1) Upload to Supabase Storage
        const { path, publicUrl } = await uploadBlueNotice(file);
        onUploaded?.([{ name: file.name, size: file.size, type: file.type, path, publicUrl }]);

        // 2) Send to OCR (make JSON parsing robust)
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        onOcrComplete(json.text || "", json.meta || {});
        onChange(json.text || "");
        setStatus("idle");
      } catch (e: any) {
        console.error(e);
        console.error({
          env: {
            hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
            hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          bucket: "blue-notices",
          file: { name: file.name, size: file.size, type: file.type },
        });
        setError(e?.message || "Upload failed");
        setStatus("error");
      }
    },
    [onChange, onOcrComplete, onUploaded]
  );

  // Do NOT use `accept` so we can allow doc/docx by extension even if MIME is missing.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div>
      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
            isDragActive ? "bg-slate-50" : ""
          }`,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">PDF, PNG or JPG</div>
          <div>Drag & drop, or click to choose file</div>
        </div>
      </div>

      {status === "uploading" && currentFile && (
        <div className="mt-2 text-sm">Uploading {currentFile.name}…</div>
      )}
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
