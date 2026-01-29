import React, { useId, useState } from "react";

/** Inline CSS so you don't have to touch your globals */
function DisclosureCSS() {
  return (
    <style>{`
      .cn-disclosure > summary::-webkit-details-marker { display: none; }
      .cn-disclosure > summary { list-style: none; }
      .cn-disclosure { overflow: hidden; }
    `}</style>
  );
}

/** Tiny class joiner */
const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/** Reusable, fully controlled disclosure (no native toggle racing React). */
function DisclosureSection({
  title,
  open = false,
  onToggle,
  children,
  className,
  bodyClassName,
  rightAdornment,
}: {
  title: string;
  open?: boolean;
  onToggle?: (next: boolean) => void;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  rightAdornment?: React.ReactNode;
}) {
  const panelId = useId();

  const onSummaryKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle?.(!open);
    }
  };

  return (
    <details
      open={open}
      className={cx(
        "cn-disclosure rounded-xl bg-white ring-1 ring-neutral-200 open:shadow-sm transition-[box-shadow] duration-150",
        className
      )}
      onToggle={(e) => e.preventDefault()}
    >
      <summary
        role="button"
        aria-expanded={open}
        aria-controls={panelId}
        tabIndex={0}
        className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 list-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:rounded-xl"
        onClick={(e) => {
          e.preventDefault();
          onToggle?.(!open);
        }}
        onKeyDown={onSummaryKeyDown}
      >
        <span className="truncate">{title}</span>
        <span className="ml-2 flex items-center gap-2">
          {rightAdornment}
          <svg
            aria-hidden
            className={cx("h-4 w-4 shrink-0 transition-transform", open ? "rotate-90" : "rotate-0")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M7.25 4.75a1 1 0 0 0-1.5 1.32l4.1 4.93-4.1 4.93a1 1 0 1 0 1.5 1.32l4.75-5.7a1 1 0 0 0 0-1.3l-4.75-5.7z" />
          </svg>
        </span>
      </summary>

      <div
        id={panelId}
        className={cx(
          "px-4 pb-4 pt-2",
          bodyClassName ?? "grid grid-cols-1 gap-4 md:grid-cols-2"
        )}
      >
        {children}
      </div>
    </details>
  );
}

/** Simple field wrapper for consistent spacing */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Visible OCR drop area so you can confirm it's mounted */
function OcrDropzone({ onFiles }: { onFiles?: (files: FileList) => void }) {
  return (
    <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:bg-slate-100">
      <input
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={(e) => e.target.files && onFiles?.(e.target.files)}
      />
      <div className="text-sm text-slate-700">
        Drop PDF/DOCX/PNG/JPG here or click to upload
      </div>
      <div className="text-xs text-slate-500">(max 25MB)</div>
    </label>
  );
}

/** 👉 Drop this into your existing page JSX: <PublishNoticeStep2Inline /> */
export default function PublishNoticeStep2Inline() {
  // Accordion behavior: one panel open at a time so OCR never disappears
  const [openKey, setOpenKey] = useState<"ocr" | "structured">("structured");
  const openOCR = openKey === "ocr";
  const openStructured = openKey === "structured";

  return (
    <>
      <DisclosureCSS />

      <div className="space-y-3">
        {/* Upload & OCR */}
        <DisclosureSection
          title="Upload & OCR"
          open={openOCR}
          onToggle={(next) => setOpenKey(next ? "ocr" : "structured")}
          bodyClassName="px-4 pb-4 pt-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <OcrDropzone onFiles={(files) => console.log("OCR files:", files)} />
              <p className="mt-2 text-xs text-slate-500">
                OCR will parse your document. You can edit the generated text before publishing.
              </p>
            </div>

            <div className="md:col-span-1 space-y-3">
              <button className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Use OCR
              </button>
              <button className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                Continue
              </button>
            </div>
          </div>
        </DisclosureSection>

        {/* Structured Fields (Template) */}
        <DisclosureSection
          title="Structured Fields (Template)"
          open={openStructured}
          onToggle={(next) => setOpenKey(next ? "structured" : "ocr")}
        >
          {/* LEFT column */}
          <div className="space-y-4 min-w-0">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Applicant details</p>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="applicantType" value="individual" />
                  Individual
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="applicantType" value="company" defaultChecked />
                  Company
                </label>
              </div>
            </div>

            <Field label="Company name" required>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="Company number">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="Contact email" required>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="Contact phone">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
          </div>

          {/* RIGHT column */}
          <div className="space-y-4 min-w-0">
            <Field label="Trading name">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="Local authority">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="LA email">
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Application &amp; deadline</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Application date">
                  <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </Field>
                <Field label="Representations deadline">
                  <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </Field>
              </div>
            </div>
          </div>

          {/* FULL-WIDTH rows */}
          <div className="md:col-span-2 space-y-4">
            <Field label="Service address line 1">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <Field label="Service address line 2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Service town / city">
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </Field>
              <Field label="Postcode">
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </Field>
            </div>
          </div>
        </DisclosureSection>
      </div>
    </>
  );
}
