import { useEffect, useState } from "react";
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

  function update<K extends keyof NoticeDraft>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "postcode" && !form.council) {
      const guess = inferCouncil(v as string);
      if (guess) setForm((f) => ({ ...f, council: guess }));
    }
  }

  function save() {
    const draft: NoticeDraft = {
      id: uid("draft"),
      createdAt: new Date().toISOString(),
      noticeType: (form.noticeType as NoticeType) || "Premises Licence",
      applicantName: form.applicantName || "",
      applicantEmail: form.applicantEmail || "",
      applicantPhone: form.applicantPhone,
      premisesName: form.premisesName,
      premisesAddress: form.premisesAddress || "",
      postcode: form.postcode || "",
      council: form.council,
      consultationStart: form.consultationStart,
      consultationEnd: form.consultationEnd,
      blueNoticeUploads: files,
      status: "Draft",
    };
    const existing = JSON.parse(localStorage.getItem("noticeDrafts") || "[]");
    existing.unshift(draft);
    localStorage.setItem("noticeDrafts", JSON.stringify(existing));
    window.location.href = "/success";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Notice Details</h1>

      <div className="rounded-2xl border p-4">
        <div className="text-sm text-slate-600 mb-2">Uploaded blue notice</div>
        {files.length === 0 ? (
          <div className="text-slate-500 text-sm">No file found (go back and upload)</div>
        ) : (
          <ul className="list-disc list-inside text-sm">
            {files.map((f) => (
              <li key={f.id}>
                <a className="underline" href={f.url} target="_blank" rel="noreferrer">
                  {f.filename}
                </a>{" "}
                — {(f.size / 1024).toFixed(1)} KB
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm">Applicant / Company</label>
          <input className="w-full border rounded p-2" onChange={(e) => update("applicantName", e.target.value)} />
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
          <input className="w-full border rounded p-2" onChange={(e) => update("applicantPhone", e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Notice Type</label>
          <select className="w-full border rounded p-2" onChange={(e) => update("noticeType", e.target.value)}>
            {["Premises Licence", "TEN", "Gambling", "Goods Vehicle Operator", "Traffic Order"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Premises Name (optional)</label>
          <input className="w-full border rounded p-2" onChange={(e) => update("premisesName", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Premises Address</label>
          <input className="w-full border rounded p-2" onChange={(e) => update("premisesAddress", e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Postcode</label>
          <input className="w-full border rounded p-2" onChange={(e) => update("postcode", e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Council / Licensing Authority</label>
          <input
            className="w-full border rounded p-2"
            value={form.council || ""}
            onChange={(e) => update("council", e.target.value)}
          />
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
