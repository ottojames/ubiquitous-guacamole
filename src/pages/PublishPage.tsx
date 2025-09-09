import React, { useEffect, useRef, useState } from "react";
import NoticeTypeSelect, { NoticeType } from "../components/publish/NoticeTypeSelect";
import PremisesForm from "../components/publish/PremisesForm";
import TrafficForm from "../components/publish/TrafficForm";
import GamblingForm from "../components/publish/GamblingForm";
import Reveal from "../components/publish/Reveal";
import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import BlueNoticeUpload from "../components/BlueNoticeUpload";
import SegmentedTabs from "../components/ui/SegmentedTabs";
import { Step } from "../components/ui/Step";
import PreviewPanel from "../components/publish/PreviewPanel";

type UploadedMeta = { id: string; filename: string; url: string; size: number; mime: string };

type Mode = "upload" | "generate";

export default function PublishPage() {
  const [mode, setMode] = useState<Mode>("upload"); // tabs
  const [type, setType] = useState<NoticeType | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<UploadedMeta[] | null>(null);
  const [ocrText, setOcrText] = useState<string>(""); // read-only preview source when on upload path

  const firstFieldRef = useRef<HTMLInputElement>(null!);
  const announceRef = useRef<HTMLDivElement>(null);

  // Receive files from uploader and keep user on page
  function handleUploaded(files: UploadedMeta[]) {
    localStorage.setItem("blueNoticeUploads", JSON.stringify(files));
    setUploaded(files);
    // ocrText is controlled inside BlueNoticeUpload; we mirror it via a CustomEvent (below)
  }

  // Listen for OCR text broadcast from the uploader (small, decoupled link)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text: string };
      setOcrText(detail?.text || "");
    };
    window.addEventListener("ocr:complete", handler as any);
    return () => window.removeEventListener("ocr:complete", handler as any);
  }, []);

  useEffect(() => {
    if (type && firstFieldRef.current) firstFieldRef.current.focus();
    if (type && announceRef.current) {
      const label = type === "premises" ? "Premises Licence form" : type === "traffic" ? "Traffic notice form" : "Gambling licence form";
      announceRef.current.textContent = `${label} loaded`;
    }
  }, [type]);

  async function submit(kind: NoticeType, data: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.from("notices").insert({
        type: kind,
        payload: JSON.stringify(data),
        applicant_email: (data as any).applicantEmail,
        council_email: (data as any).councilEmail,
        address_line1: (data as any).address_line1 ?? null,
        address_line2: (data as any).address_line2 ?? null,
        city: (data as any).city ?? null,
        status: "draft",
      });
      if (error) throw error;
      window.location.href = "/success";
    } catch {
      setError("Unable to save notice");
    } finally {
      setSaving(false);
    }
  }

  const copyPreview = () => {
    navigator.clipboard?.writeText(ocrText || "");
  };
  const downloadPreviewPdf = () => {
    // TODO: wire to server endpoint that renders a draft PDF from structured data
    window.open("/api/preview-pdf?source=upload", "_blank");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)" }}
    >
      <SiteHeader />
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl bg-white/95 rounded-2xl ring-1 ring-slate-200 shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Publish a Notice</h1>
            <SegmentedTabs
              value={mode}
              onChange={setMode}
              tabs={[
                { value: "upload", label: "I already have a notice" },
                { value: "generate", label: "Generate from template" },
              ]}
            />
          </div>

          {/* PATH 1: Upload + OCR */}
          {mode === "upload" && (
            <>
              <Step title="Upload & OCR" defaultOpen>
                <BlueNoticeUpload
                  onUploaded={(files) => {
                    handleUploaded(files);
                  }}
                />
              </Step>

              <Step title="OCR Preview (Read-only)" defaultOpen={!!ocrText}>
                <PreviewPanel value={ocrText} onCopy={copyPreview} onDownloadPdf={downloadPreviewPdf} />
              </Step>
            </>
          )}

          {/* PATH 2: Generate from template */}
          {mode === "generate" && (
            <>
              <Step title="1. Choose notice type" defaultOpen>
                <NoticeTypeSelect value={type} onChange={setType} />
                <div ref={announceRef} aria-live="polite" className="sr-only" />
              </Step>

              <Reveal show={type === "premises"}>
                {type === "premises" && (
                  <Step title="2. Applicant & Premises → Activities & Hours → Council" subtitle="Fields validate on blur">
                    <PremisesForm
                      onSubmit={(d) => submit("premises", d as unknown as Record<string, unknown>)}
                      saving={saving}
                      autoFocusRef={firstFieldRef}
                    />
                  </Step>
                )}
              </Reveal>

              <Reveal show={type === "traffic"}>
                {type === "traffic" && (
                  <Step title="2. Traffic form details" subtitle="Complete each section then continue">
                    <TrafficForm
                      onSubmit={(d) => submit("traffic", d as unknown as Record<string, unknown>)}
                      saving={saving}
                      autoFocusRef={firstFieldRef}
                    />
                  </Step>
                )}
              </Reveal>

              <Reveal show={type === "gambling"}>
                {type === "gambling" && (
                  <Step title="2. Gambling form details" subtitle="Complete each section then continue">
                    <GamblingForm
                      onSubmit={(d) => submit("gambling", d as unknown as Record<string, unknown>)}
                      saving={saving}
                      autoFocusRef={firstFieldRef}
                    />
                  </Step>
                )}
              </Reveal>
            </>
          )}

          {uploaded && uploaded.length > 0 && mode === "upload" && (
            <div className="mt-4 rounded border p-3 text-sm">
              <div className="font-semibold mb-2">Uploaded files</div>
              <ul className="list-disc pl-5 space-y-1">
                {uploaded.map((f) => (
                  <li key={f.id}>
                    {f.filename} —{" "}
                    <a className="text-blue-600 underline" href={f.url} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    </div>
  );
}
