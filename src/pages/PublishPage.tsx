import React, { useEffect, useState } from "react";
import UploadPremisesNoticeNoticeForm from "../components/UploadPremisesNoticeNoticeForm";
import AddressAutocomplete, { AddressOption } from "../components/AddressAutocomplete";
import NoFileBuilder from "../components/NoFileBuilder";

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
  const [councilQuery, setCouncilQuery] = useState("");
  const [councilOptions, setCouncilOptions] = useState<{ name: string; email: string }[]>([]);
  const [selectedCouncil, setSelectedCouncil] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      const q = councilQuery.trim().toLowerCase();
      if (!q) {
        setCouncilOptions([]);
        return;
      }
      const res = await fetch('/councils.json');
      const all = (await res.json()) as { name: string; email: string }[];
      const matches = all.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
      if (!cancel) setCouncilOptions(matches);
    };
    const t = setTimeout(run, 150);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [councilQuery]);

  const onPickCouncil = (c: { name: string; email: string }) => {
    setSelectedCouncil(c);
    setCouncilQuery(c.name);
    setForm((f) => ({ ...f, councilName: c.name, councilEmail: c.email }));
    setCouncilOptions([]);
  };

  const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  const councilValid =
    selectedCouncil !== null ||
    (form.councilName.trim() && form.councilEmail.trim());
  const requiredFilled =
    form.applicantName.trim() &&
    isEmail(form.applicantEmail) &&
    councilValid &&
    (!form.councilEmail || isEmail(form.councilEmail)) &&
    form.premisesAddress.line1.trim() &&
    form.premisesAddress.postcode.trim();
  const disabled = publishing || !requiredFilled;

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

  const handleAddress = (a: AddressOption) => {
    setForm((f) => ({ ...f, premisesAddress: a }));
    setEditingAddress(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Publish a Notice</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <UploadPremisesNoticeNoticeForm
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
          </div>
          <div className="relative">
            <label className="block text-sm font-medium">Council Name</label>
            <input
              className="w-full border rounded p-2"
              value={councilQuery}
              onChange={(e) => {
                setCouncilQuery(e.target.value);
                setForm({ ...form, councilName: e.target.value });
              }}
            />
            {councilOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
                {councilOptions.map((c) => (
                  <div
                    key={c.name}
                    className="px-2 py-1 hover:bg-slate-100 cursor-pointer"
                    onClick={() => onPickCouncil(c)}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Council Email</label>
            <input
              className="w-full border rounded p-2"
              value={form.councilEmail}
              onChange={(e) => setForm({ ...form, councilEmail: e.target.value })}
            />
          </div>
          <div>
            <AddressAutocomplete onSelect={handleAddress} />
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
