// src/components/BlueNoticeUpload.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "../lib/supabase";
import PremisesAddressPicker from "./PremisesAddressPicker";
import type { PremisesAddress } from "../types/address";

type UploadedMeta = {
  id: string;
  filename: string;
  url: string;
  size: number;
  mime: string;
};

export default function BlueNoticeUpload({
  onUploaded,
}: {
  onUploaded: (files: UploadedMeta[]) => void;
}) {
  console.log("### BLUE NOTICE UPLOAD COMPONENT IS LIVE ###");

  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string>("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [ocrText, setOcrText] = useState<string>("");

  // NEW: store the chosen premises address (single component state)
  const [premisesAddress, setPremisesAddress] = useState<PremisesAddress | null>(
    null
  );

  // --- OCR helpers -----------------------------------------------------------
  const runOcr = useCallback(async (file: File, publicUrl?: string) => {
    setOcrStatus("running");

    // Try URL-based OCR first (if your API supports it)
    try {
      if (publicUrl) {
        const r = await fetch("/api/ocr-from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: publicUrl }),
        });
        if (r.ok) {
          const j = await r.json();
          const text = j?.data?.ocr_text ?? j?.ocr_text ?? j?.text ?? "";
          if (text) {
            setOcrText(text);
            setOcrStatus("done");
            return;
          }
        }
      }
    } catch {
      /* fall through to file-based OCR */
    }

    // Fallback: send the file itself
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/ocr", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error?.message || j?.message || "OCR failed");
      const text = j?.data?.ocr_text ?? j?.ocr_text ?? j?.text ?? "";
      setOcrText(text || "");
      setOcrStatus("done");
    } catch (e: any) {
      setOcrStatus("error");
      setError(e?.message || "OCR failed");
    }
  }, []);

  // --- Upload to Supabase ----------------------------------------------------
  const uploadToSupabase = useCallback(async (files: File[]): Promise<UploadedMeta[]> => {
    const bucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "blue-notices";
    const expires = Number(import.meta.env.VITE_SUPABASE_SIGNED_URL_EXPIRES || 604800);
    const maxMb = Number(import.meta.env.VITE_MAX_UPLOAD_MB || 15);
    const results: UploadedMeta[] = [];

    for (const f of files) {
      if (f.size > maxMb * 1024 * 1024)
        throw new Error(`File too large (max ${maxMb} MB): ${f.name}`);

      const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
      const key = `${Date.now()}-${
        (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2)
      }.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(key, f, {
          cacheControl: "3600",
          upsert: false,
          contentType: f.type || undefined,
        });
      if (upErr) throw upErr;

      // For public buckets
      const { data } = supabase.storage.from(bucket).getPublicUrl(key);
      const url = data.publicUrl;

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

  // --- Drop handler ----------------------------------------------------------
  const onDrop = useCallback(
    async (accepted: File[], fileRejections: any[]) => {
      console.log("ACCEPTED:", accepted);
      console.log("REJECTED:", fileRejections);

      if (fileRejections?.length) {
        const reasons = fileRejections.flatMap((r) =>
          r.errors.map((e: any) => e.message)
        );
        setStatus("error");
        setError(reasons.join("; ") || "File rejected");
        return;
      }

      if (!accepted.length) return;
      setError("");
      setStatus("uploading");
      setOcrText("");
      setOcrStatus("idle");

      try {
        const metas = await uploadToSupabase(accepted);
        onUploaded(metas); // keep your existing callback

        // Stay on page and show OCR preview
        const firstFile = accepted[0];
        const firstUrl = metas[0]?.url;
        await runOcr(firstFile, firstUrl);

        setStatus("done");
      } catch (e: any) {
        console.error(e);
        setStatus("error");
        setError(e?.message || "Upload/OCR failed");
      }
    },
    [uploadToSupabase, onUploaded, runOcr]
  );

  // react-dropzone v14: pass object `accept` and `onDrop`
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: (Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 15) * 1024 * 1024,
  });

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="mb-2 text-lg font-semibold">
        Upload your file — OCR will appear below
      </div>

      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
            isDragActive ? "bg-slate-50" : ""
          }`,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">
            .PDF, .DOCX, .PNG or .JPG (max{" "}
            {Number(import.meta.env.VITE_MAX_UPLOAD_MB || 15)} MB)
          </div>
          <div>Drag & drop, or click to choose a file</div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Old .DOC files aren’t supported — please save as PDF or DOCX before
        uploading.
      </p>

      {status === "uploading" && <div className="mt-3 text-sm">Uploading…</div>}
      {status === "done" && ocrStatus === "running" && (
        <div className="mt-3 text-sm">Running OCR…</div>
      )}
      {status === "done" && ocrStatus === "done" && (
        <div className="mt-3 text-sm text-emerald-600">
          Uploaded. OCR complete.
        </div>
      )}
      {(status === "error" || ocrStatus === "error") && (
        <div className="mt-3 text-sm text-rose-600">{error}</div>
      )}

      {ocrText && (
        <div className="mt-6">
          <label className="block font-semibold mb-2">OCR Preview (Editable)</label>
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={12}
            className="w-full border px-3 py-2 rounded font-mono"
          />
        </div>
      )}

      {/* NEW: Premises address picker */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Premises address
        </label>

        <PremisesAddressPicker
          value={premisesAddress}
          onChange={(addr) => {
            setPremisesAddress(addr);
          }}
        />

        {premisesAddress?.formatted_single_line && (
          <p className="mt-2 text-sm text-slate-700">
            We’ll publish the address exactly as shown:{" "}
            <span className="font-medium">
              {premisesAddress.formatted_single_line}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
