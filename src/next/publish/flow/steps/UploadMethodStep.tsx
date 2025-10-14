import React from "react";
import * as UI from "@/styles/ui";
import StickyRailLayout from "@/next/publish/flow/components/StickyRailLayout";
import UploadOcrPane, { type UploadOcrPaneProps } from "@/next/publish/flow/components/UploadOcrPane";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import { useSafeTransition } from "@/wizard/useSafeTransition";

export type UploadMethod = "notice" | "template";

type Props = {
  definition: NoticeDefinition | null;
  method: UploadMethod | null;
  onMethodChange: (m: UploadMethod) => void;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continuePending?: boolean;
  uploadPaneProps: UploadOcrPaneProps;
  templateContent: React.ReactNode;
  rightRail?: React.ReactNode;
};

export default function UploadMethodStep({
  definition,
  method,
  onMethodChange,
  onBack,
  onContinue,
  continueDisabled,
  continuePending,
  uploadPaneProps,
  templateContent,
  rightRail,
}: Props) {
  const inferredDefaultMethod = React.useMemo<UploadMethod>(
    () => (definition?.id?.includes("premises") ? "notice" : "template"),
    [definition?.id]
  );
  const [active, setActive] = React.useState<UploadMethod>(method ?? inferredDefaultMethod);
  const methodRef = React.useRef<UploadMethod | null>(method ?? null);
  const { run: chooseMethod, pending: switching } = useSafeTransition(async (key: UploadMethod) => {
    if (methodRef.current === key) return;
    methodRef.current = key;
    setActive(key);
    onMethodChange(key);
  });

  React.useEffect(() => {
    if (method) {
      methodRef.current = method;
      setActive(method);
    } else {
      methodRef.current = null;
      setActive(inferredDefaultMethod);
    }
  }, [method, inferredDefaultMethod]);

  const toggle = (key: UploadMethod) => {
    setActive(key);
    if (key === "notice" && methodRef.current === null) return;
    chooseMethod(key);
  };

  // Guard undefined definition access
  const defLabel = definition?.label ?? "this notice type";

  return (
    <section
      className="mx-auto max-w-6xl space-y-10"
      data-testid="upload-method-step"
      aria-busy={continuePending || switching ? "true" : undefined}
    >
      {/* Glass Section Header Card */}
      <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              Upload your notice
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
              You can upload a signed notice or build from our structured template. We'll extract your text automatically.
            </p>
          </div>

          {/* Premium Segmented Control */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => toggle("notice")}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  active === "notice"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-pressed={active === "notice"}
              >
                Upload & OCR
              </button>
              <button
                type="button"
                onClick={() => toggle("template")}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  active === "template"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-pressed={active === "template"}
              >
                Structured template
              </button>
            </div>
          </div>
        </div>
      </header>

      <StickyRailLayout
        left={
          <div className="relative space-y-8 pb-32">
            {/* Upload Content */}
            {active === "notice" ? (
              <div className="space-y-6">
                <UploadOcrPane
                  {...uploadPaneProps}
                  onSwitchToTemplate={() => toggle("template")}
                />

                {/* Reassurance Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Encrypted in transit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    OCR completes in seconds
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    You can edit everything after upload
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6" data-testid="upload-template-panel">
                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-8">
                  <div className="mb-6 space-y-1.5">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                      Structured fields
                    </p>
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      Tailored questions keep you compliant. Switch back to OCR at any point—your inputs are preserved.
                    </p>
                  </div>
                  {templateContent}
                </div>
                <p className="text-[12px] leading-relaxed text-slate-500">
                  Already have a signed notice? Choose Upload & OCR to extract the text automatically.
                </p>
              </div>
            )}

            {/* Premium Sticky Action Bar */}
            <div className="sticky bottom-6 -mx-4 sm:-mx-0">
              <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-6 px-8 py-6">
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                    data-testid="upload-step-back"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  <div className="flex flex-1 items-center justify-end gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {continueDisabled ? "Complete required fields" : "Looking good"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {continueDisabled
                          ? "All mandatory fields must appear on the public notice."
                          : "Ready to review your notice details."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onContinue}
                      disabled={!!continueDisabled || continuePending || switching}
                      className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                        continueDisabled
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      data-testid="upload-step-continue"
                    >
                      {continuePending ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Working...
                        </>
                      ) : (
                        <>
                          Continue
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        right={rightRail ?? null}
      />
    </section>
  );
}
