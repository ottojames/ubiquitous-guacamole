import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "../lib/supabase";

type UploadedMeta = { id: string; filename: string; url: string; size: number; mime: string };

export default function BlueNoticeUpload({ onUploaded }: { onUploaded: (files: UploadedMeta[]) => void }) {
  const [status, setStatus] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [error, setError] = useState<string>("");

  const uploadToSupabase = useCallback(async (files: File[]): Promise<UploadedMeta[]> => {
    const bucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "blue-notices";
    const expires = Number(import.meta.env.VITE_SUPABASE_SIGNED_URL_EXPIRES || 604800);
    const maxMb = Number(import.meta.env.VITE_MAX_UPLOAD_MB || 15);
    const results: UploadedMeta[] = [];

    for (const f of files) {
      if (f.size > maxMb * 1024 * 1024) throw new Error(`File too large (max ${maxMb} MB): ${f.name}`);

      const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
      const key = `${Date.now()}-${(crypto as any).randomUUID?.() || Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(key, f, {
        cacheControl: "3600",
        upsert: false,
        contentType: f.type || undefined,
      });
      if (upErr) throw upErr;

      const USE_PUBLIC_URL = true; // set false if bucket is private
      let url = "";
      if (USE_PUBLIC_URL) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(key);
        url = data.publicUrl;
      } else {
        const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(key, expires);
        if (signErr) throw signErr;
        url = data!.signedUrl;
      }

      results.push({
        id: `up_${Math.random().toString(36).slice(2, 9)}`,
        filename: f.name,
        url,
        size: f.size,
        mime: f.type || "application/octet-stream",
      });
    }
    return results;
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setError("");
    setStatus("uploading");
    try {
      const metas = await uploadToSupabase(accepted);
      localStorage.setItem("blueNoticeUploads", JSON.stringify(metas));
      setStatus("done");
      onUploaded(metas);
      setTimeout(() => { window.location.assign("/details"); }, 300);
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setError(e?.message || "Upload failed");
    }
  }, [uploadToSupabase, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg"]
    },
    maxSize: Number(import.meta.env.VITE_MAX_UPLOAD_MB || 15) * 1024 * 1024,
  });

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="mb-2 text-lg font-semibold">Already have your blue notice? Upload here</div>
      <div {...getRootProps({ className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${isDragActive ? "bg-slate-50" : ""}` })}>
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">PDF, DOC, DOCX, PNG or JPG (max {Number(import.meta.env.VITE_MAX_UPLOAD_MB || 15)} MB)</div>
          <div>Drag & drop, or click to choose file(s)</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        After upload, you’ll see a preview below. Please check your notice for any mistakes.
      </p>
      {status === "uploading" && <div className="mt-3 text-sm">Uploading…</div>}
      {status === "done" && <div className="mt-3 text-sm text-emerald-600">Uploaded. Redirecting…</div>}
      {status === "error" && <div className="mt-3 text-sm text-rose-600">{error}</div>}
    </div>
  );
}
