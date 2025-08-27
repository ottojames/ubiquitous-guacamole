import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

type UploadedMeta = { id: string; filename: string; url: string; size: number; mime: string };
export default function BlueNoticeUpload({ onUploaded }: { onUploaded: (files: UploadedMeta[]) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setStatus("uploading");
    setError("");
    const form = new FormData();
    accepted.forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/uploads/blue-notice", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = await res.json();
      setStatus("done");
      onUploaded(json.files);
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Upload failed");
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 15 * 1024 * 1024,
  });

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="mb-2 text-lg font-semibold">Already have your blue notice? Upload here</div>
      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${isDragActive ? "bg-slate-50" : ""}`,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">PDF, DOC, DOCX, PNG or JPG (max 15 MB)</div>
          <div>Drag & drop, or click to choose file(s)</div>
        </div>
      </div>
      {status === "uploading" && <div className="mt-3 text-sm">Uploading…</div>}
      {status === "done" && <div className="mt-3 text-sm text-emerald-600">Uploaded. Continue below.</div>}
      {status === "error" && <div className="mt-3 text-sm text-rose-600">{error}</div>}
    </div>
  );
}
