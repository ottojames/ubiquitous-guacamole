import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { generateNotice } from "../lib/noticeTemplate";
import PremisesAddressPicker from "./PremisesAddressPicker";
import type { PremisesAddress } from "../types/address";
import { councils, type Council } from "../data/councils";
import { computeRepDeadline } from "../lib/computeRepDeadline";

const schema = z.object({
  applicantName: z.string().min(1, "Required"),
  applicantEmail: z.string().email("Invalid email"),
  councilName: z.string().min(1, "Required"),
  file: z.instanceof(File, { message: "File is required" }),
});

type FormData = z.infer<typeof schema>;

export default function UploadPremisesNoticeForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [ocrText, setOcrText] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const councilName = watch("councilName");
const councilEmail = councils.find((c) => c.name === councilName)?.licensingEmail ?? "";

  const onSubmit = async (data: FormData) => {
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("applicantName", data.applicantName);
    formData.append("applicantEmail", data.applicantEmail);
    formData.append("councilName", data.councilName);
    formData.append("councilEmail", councilEmail);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");

      setOcrText(json?.data?.ocr_text || json.ocr_text || "");
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <label className="block font-semibold">Applicant Name</label>
        <input
          {...register("applicantName")}
          className="border px-3 py-2 rounded w-full"
        />
        {errors.applicantName && <p className="text-red-500">{errors.applicantName.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Applicant Email</label>
        <input
          type="email"
          {...register("applicantEmail")}
          className="border px-3 py-2 rounded w-full"
        />
        {errors.applicantEmail && <p className="text-red-500">{errors.applicantEmail.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Council</label>
        <select
          {...register("councilName")}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">Select Council</option>
          {councils.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.councilName && <p className="text-red-500">{errors.councilName.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Council Email</label>
        <input
          type="email"
          value={councilEmail}
          readOnly
          className="border px-3 py-2 rounded w-full bg-gray-100"
        />
      </div>

      <div>
        <label className="block font-semibold">Upload Notice File</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.rtf,.txt"
          {...register("file")}
        />
        {errors.file && <p className="text-red-500">{errors.file.message}</p>}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={status === "uploading"}
      >
        {status === "uploading" ? "Uploading..." : "Upload and Preview"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

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
    </form>
  );
}
