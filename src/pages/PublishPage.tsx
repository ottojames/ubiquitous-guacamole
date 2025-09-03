import React, { useState } from "react";
import BlueNoticeUpload from "../components/BlueNoticeUpload";
import CouncilCombobox, { CouncilOption } from "../components/CouncilCombobox";
import AddressAutocomplete, { AddressOption } from "../components/AddressAutocomplete";
import NoFileBuilder from "../components/NoFileBuilder";
import { validatePublishForm } from "../utils/validation";

export default function PublishPage() {
  const [noticeText, setNoticeText] = useState("");
  const [engine, setEngine] = useState("");
  const [meta, setMeta] = useState<any>({});
  const [useBuilder, setUseBuilder] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    applicantName: "",
    applicantEmail: "",
    councilName: "",
    councilEmail: "",
    premisesAddress: { line1: "", line2: "", line3: "", city: "", postcode: "" },
  });
  const errors = validatePublishForm({ ...form, noticeText });
  const disabled = publishing || Object.keys(errors).length > 0;

  const handlePublish = async () => {
    if (disabled) return;
    setPublishing(true);
    try {
      const payload = {
        applicantName: form.applicantName,
        applicantEmail: form.applicantEmail,
        councilName: form.councilName,
        councilEmail: form.councilEmail,
        premisesAddress: form.premisesAddress,
        noticeText,
        source: useBuilder ? "form" : "upload",
        meta,
      };
      await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore in this simplified implementation
    } finally {
      setPublishing(false);
    }
  };

  const handleCouncil = (c: CouncilOption) => {
    setForm((f) => ({ ...f, councilName: c.name, councilEmail: c.email || '' }));
  };

  const handleAddress = (a: AddressOption) => {
    setForm((f) => ({ ...f, premisesAddress: a }));
    setEditingAddress(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Publish a Notice</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <BlueNoticeUpload
            value={noticeText}
            onChange={setNoticeText}
            onOcrComplete={(text, m) => {
              setNoticeText(text);
              setMeta(m);
              setEngine(m?.engine || "");
            }}
            engine={engine}
            applicantName={form.applicantName}
            applicantEmail={form.applicantEmail}
            councilName={form.councilName}
            councilEmail={form.councilEmail}
            premisesAddress={JSON.stringify(form.premisesAddress)}
          />
          <div className="mt-4">
            <label className="inline-flex items-center gap-2" data-testid="toggle-no-file-builder">
              <input
                type="checkbox"
                checked={useBuilder}
                onChange={(e) => {
                  setUseBuilder(e.target.checked);
                }}
              />
              <span>No file? Build my notice from details</span>
            </label>
            {useBuilder && <NoFileBuilder councilEmail={form.councilEmail} onChange={setNoticeText} />}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">
              Applicant Name<span className="text-rose-600 ml-0.5">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={form.applicantName}
              onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
            />
            {errors.applicantName && <p className="text-xs text-rose-600">{errors.applicantName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">
              Applicant Email<span className="text-rose-600 ml-0.5">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={form.applicantEmail}
              onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
            />
            {errors.applicantEmail && <p className="text-xs text-rose-600">{errors.applicantEmail}</p>}
          </div>
          <div>
            <CouncilCombobox onSelect={handleCouncil} />
            {errors.councilName && <p className="text-xs text-rose-600">{errors.councilName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">
              Council Email<span className="text-rose-600 ml-0.5">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={form.councilEmail}
              onChange={(e) => setForm({ ...form, councilEmail: e.target.value })}
            />
            {errors.councilEmail && <p className="text-xs text-rose-600">{errors.councilEmail}</p>}
          </div>
          <div>
            <AddressAutocomplete onSelect={handleAddress} />
            {errors.premisesAddress && <p className="text-xs text-rose-600">{errors.premisesAddress}</p>}
            {form.premisesAddress.line1 && (
              <div className="mt-2 space-y-1">
                {(["line1", "line2", "line3", "city", "postcode"] as const).map((f) => (
                  <input
                    key={f}
                    className="w-full border rounded p-2"
                    value={(form.premisesAddress as any)[f] || ""}
                    readOnly={!editingAddress}
                    placeholder={f}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        premisesAddress: { ...form.premisesAddress, [f]: e.target.value },
                      })
                    }
                  />
                ))}
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => setEditingAddress((v) => !v)}
                >
                  {editingAddress ? "Done" : "Edit"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        data-testid="publish-btn"
        className="mt-6 px-4 py-2 bg-slate-800 text-white rounded disabled:opacity-50"
        disabled={disabled}
        onClick={handlePublish}
      >
        Publish
      </button>
    </div>
  );
}
