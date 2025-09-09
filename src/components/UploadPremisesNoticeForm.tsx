import React from "react";

export type UploadPremisesNoticeFormProps = {
  value: string;
  onChange: (next: string) => void;
  onOcrComplete?: (text: string, meta?: { engine?: string; [k: string]: unknown }) => void;
  engine?: string;
  applicantName?: string;
  applicantEmail?: string;
  councilName?: string;
  councilEmail?: string;
  premisesAddress?: string;
};

const safeParse = (raw?: string) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export default function UploadPremisesNoticeForm(props: UploadPremisesNoticeFormProps) {
  const {
    value,
    onChange,
    onOcrComplete,
    engine,
    applicantName,
    applicantEmail,
    councilName,
    councilEmail,
    premisesAddress,
  } = props;

  const addr = safeParse(premisesAddress) ?? premisesAddress;

  const handleFileUpload = async (file: File) => {
    try {
      // TODO: replace with existing project OCR endpoint if available
      // Example:
      // const form = new FormData();
      // form.append("file", file);
      // const res = await fetch("/api/ocr", { method: "POST", body: form });
      // const { text, meta } = await res.json();

      // For now, stub a successful OCR response:
      const text = value || "/* OCR text goes here */";
      const meta = { engine: engine ?? "unknown" };

      onChange(text);
      onOcrComplete?.(text, meta);
    } catch (err) {
      console.error("Upload/OCR failed:", err);
      // Non-crashing UX; optionally show a toast if the project has one
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Upload file</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.doc,.docx"
          className="block w-full text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-100 focus-visible:ring-2 ring-offset-2"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFileUpload(f);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notice text</label>
        <textarea
          data-testid="notice-editor"
          className="w-full min-h-[200px] border rounded p-2 focus-visible:ring-2 ring-offset-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or edit the notice text…"
        />
      </div>

      <div className="rounded border p-3">
        <div className="text-sm opacity-70 mb-2">Preview / Context</div>
        <ul className="text-sm space-y-1">
          {applicantName && <li><strong>Applicant:</strong> {applicantName}</li>}
          {applicantEmail && <li><strong>Email:</strong> {applicantEmail}</li>}
          {councilName && <li><strong>Council:</strong> {councilName}</li>}
          {councilEmail && <li><strong>Council Email:</strong> {councilEmail}</li>}
          {addr && (
            <li>
              <strong>Premises:</strong>{" "}
              {typeof addr === "string" ? addr : JSON.stringify(addr)}
            </li>
          )}
          {engine && <li><strong>OCR Engine:</strong> {engine}</li>}
        </ul>
      </div>
    </div>
  );
}
