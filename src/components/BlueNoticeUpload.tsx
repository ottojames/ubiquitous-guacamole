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

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/rtf",
  "text/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".rtf",
  ".doc",
  ".docx",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function isAcceptedFile(file: File) {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

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

      if (!isAcceptedFile(file)) {
        setStatus("error");
        setError("Unsupported file type");
        return;
      }
      if (file.size > MAX_SIZE) {
        setStatus("error");
        setError("File must be 10 MB or less");
        return;
      }

      setStatus("uploading");
      try {
        const { path, publicUrl } = await uploadBlueNotice(file);
        onUploaded?.([
          { name: file.name, size: file.size, type: file.type, path, publicUrl },
        ]);

        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/ocr", { method: "POST", body: fd });
        const textBody = await res.text();
        let json: any = {};
        if (
          textBody &&
          res.headers.get("content-type")?.includes("application/json")
        ) {
          try {
            json = JSON.parse(textBody);
          } catch {}
        }
        if (!res.ok) {
          const msg =
            json?.meta?.error || json?.error || res.statusText || "OCR failed";
          throw new Error(msg);
        }
        const ocrText = json.text || "";
        onOcrComplete(ocrText, json.meta || {});
        if (ocrText) onChange(ocrText);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "text/plain": [".txt"],
      "application/rtf": [".rtf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
  });

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
          <div className="font-medium mb-1">PDF, PNG, JPG, TXT, RTF, DOC or DOCX</div>
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
