import { useEffect, useState } from "react";
import AddressAutocomplete, { AddressOption } from "../components/AddressAutocomplete";
import { NoticeDraft, NoticeType, UploadedFile } from "../types/notice";
import { uid, inferCouncil } from "../lib/utils";

export default function DetailsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [form, setForm] = useState<Partial<NoticeDraft>>({
    noticeType: "Premises Licence",
    status: "Draft",
  } as any);

  useEffect(() => {
    const raw = localStorage.getItem("blueNoticeUploads");
    if (raw) setFiles(JSON.parse(raw));
  }, []);

  function update<K extends keyof NoticeDraft>(k: K, v: NoticeDraft[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "postcode") {
      const guess = inferCouncil(String(v));
      if (guess && !form.councilName) setForm((f) => ({ ...f, councilName: guess }));
    }
  }

  function onAddressSelect(a: AddressOption) {
    update("premisesAddress", a.line1 + (a.city ? `, ${a.city}` : ""));
    if (a.postcode) update("postcode", a.postcode);
  }

  async function save() {
    const required = [
      "applicantName",
      "applicantEmail",
      "premisesAddress",
      "postcode",
      "noticeType",
      "councilEmail",
    ] as const;
    for (const f of required) {
      if (!(form as any)[f]) {
        alert(`Please fill ${f}`);
        return;
      }
    }
    const draft: NoticeDraft = {
      id: uid("draft"),
      createdAt: new Date().toISOString(),
      noticeType: (form.noticeType as NoticeType) || "Premises Licence",
      applicantName: form.applicantName!,
      applicantEmail: form.applicantEmail!,
      applicantPhone: form.applicantPhone,
      premisesName: form.premisesName,
      premisesAddress: form.premisesAddress!,
      postcode: form.postcode!,
      councilName: form.councilName ?? '',
      councilEmail: form.councilEmail ?? '',
      councilAddress: form.councilAddress ?? '',
      consultationStart: form.consultationStart,
      consultationEnd: form.consultationEnd,
      blueNoticeUploads: files,
      status: "Draft",
      applicationDate: form.applicationDate ?? '',
    };
    const existing = JSON.parse(localStorage.getItem("noticeDrafts") || "[]");
    existing.unshift(draft);
    localStorage.setItem("noticeDrafts", JSON.stringify(existing));

    try {
      await fetch("/api/notify/notice-saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantEmail: draft.applicantEmail,
          councilEmail: draft.councilEmail,
          draftId: draft.id,
          uploads: draft.blueNoticeUploads,
        }),
      });
    } catch {
      // ignore
    }

    window.location.assign("/success");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Notice Details</h1>

      {/* Uploaded preview */}
      <div className="rounded-2xl border p-4">
        <div className="text-sm text-slate-600 mb-2">Uploaded blue notice</div>
        {files.length === 0 ? (
          <div className="text-slate-500 text-sm">No file found (go back and upload)</div>
        ) : (
          <div className="space-y-3">
            <div className="rounded bg-amber-50 text-amber-900 p-2 text-sm">
              Please review your notice below for any mistakes.
            </div>
            {files.map((f) => (
              <div key={f.id} className="space-y-2">
                <div className="text-sm">
                  {f.filename} — {(f.size / 1024).toFixed(1)} KB
                </div>
                {f.mime?.startsWith("image/") ? (
                  <img src={f.url} alt={f.filename} className="max-h-96 rounded border" />
                ) : f.mime === "application/pdf" || f.filename.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={f.url} className="w-full h-[480px] rounded border" />
                ) : (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-600"
                  >
                    View file
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm">Applicant / Company</label>
          <input
            className="w-full border rounded p-2"
            onChange={(e) => update("applicantName", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Applicant Email</label>
          <input
            type="email"
            className="w-full border rounded p-2"
            onChange={(e) => update("applicantEmail", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Applicant Phone (optional)</label>
          <input
            className="w-full border rounded p-2"
            onChange={(e) => update("applicantPhone", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Notice Type</label>
          <select
            className="w-full border rounded p-2"
            onChange={(e) => update("noticeType", e.target.value as NoticeType)}
          >
            {["Premises Licence", "TEN", "Gambling", "Goods Vehicle Operator", "Traffic Order"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Premises Name (optional)</label>
          <input
            className="w-full border rounded p-2"
            onChange={(e) => update("premisesName", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Premises address</label>
          <AddressAutocomplete onSelect={onAddressSelect} />
          <input
            className="mt-2 w-full border rounded p-2"
            placeholder="Address line (editable)"
            value={form.premisesAddress || ""}
            onChange={(e) => update("premisesAddress", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Postcode</label>
          <input
            className="w-full border rounded p-2"
            value={form.postcode || ""}
            onChange={(e) => update("postcode", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Council / Licensing Authority</label>
          <input
            className="w-full border rounded p-2"
            value={form.councilName || ""}
            onChange={(e) => update("councilName", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Council email (required)</label>
          <input
            type="email"
            className="w-full border rounded p-2"
            placeholder="e.g. licensing@council.gov.uk"
            onChange={(e) => update("councilEmail", e.target.value)}
          />
          {form.postcode && form.councilName && (
            <div className="text-xs text-slate-500 mt-1">
              Tip: try licensing@
              {String(form.councilName).toLowerCase().replace(/\s+/g, "")}.
              gov.uk (edit if different).
            </div>
          )}
        </div>
        <div>
          <label className="text-sm">Consultation Start</label>
          <input
            type="date"
            className="w-full border rounded p-2"
            onChange={(e) => update("consultationStart", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Consultation End</label>
          <input
            type="date"
            className="w-full border rounded p-2"
            onChange={(e) => update("consultationEnd", e.target.value)}
          />
        </div>
      </div>

      <button onClick={save} className="rounded-lg bg-black px-4 py-2 text-white">
        Save & Continue
      </button>
    </div>
  );
}
