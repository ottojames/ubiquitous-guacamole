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
      className="space-y-6"
      data-testid="upload-method-step"
      aria-busy={continuePending || switching ? "true" : undefined}
    >
      <div data-e2e="step-marker" data-step="step-2">STEP: UploadMethodStep</div>
      <StickyRailLayout
        left={
          <div className="relative space-y-12 pb-32">
            <section className={`${UI.wizardCard} border-blue-100/70 shadow-[0_32px_96px_rgba(15,23,42,0.16)]`}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(37,99,235,0.12)_0%,rgba(37,99,235,0)_55%)]"
              />
              <div className="relative flex flex-col gap-8 px-8 py-12 sm:px-12 sm:py-14">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className={UI.wizardPill}>Step 2 of 4</span>
                  <span className="text-xs text-slate-500">Upload or build from template — switch any time.</span>
                </div>

                <div className="space-y-5">
                  <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-[40px] lg:text-5xl">
                    Prepare your notice
                  </h2>
                  <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                    Upload the signed notice for OCR or complete the structured template tailored to{" "}
                    <strong className="font-semibold text-slate-900">{defLabel}</strong>. We validate the essentials while you work.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-1.5 text-sm font-semibold text-slate-600 shadow-inner">
                  <button
                    type="button"
                    onClick={() => toggle("notice")}
                    className={`flex-1 rounded-xl px-5 py-3 transition-all duration-300 ease-out ${
                      active === "notice"
                        ? "bg-white text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.08)] scale-[1.01]"
                        : "hover:text-slate-900 hover:bg-white/50"
                    }`}
                    aria-pressed={active === "notice"}
                  >
                    Upload & OCR
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle("template")}
                    className={`flex-1 rounded-xl px-5 py-3 transition-all duration-300 ease-out ${
                      active === "template"
                        ? "bg-white text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.08)] scale-[1.01]"
                        : "hover:text-slate-900 hover:bg-white/50"
                    }`}
                    aria-pressed={active === "template"}
                  >
                    Structured template
                  </button>
                </div>

                <div className="space-y-8">
                  {active === "notice" ? (
                    <UploadOcrPane
                      {...uploadPaneProps}
                      onSwitchToTemplate={() => toggle("template")}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Structured fields
                          </p>
                          <p className="text-sm leading-6 text-slate-600">
                            Tailored questions keep you compliant. Switch back to OCR at any point—your inputs are preserved.
                          </p>
                        </div>
                        <div className="space-y-6">{templateContent}</div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Already have a signed notice? Choose Upload &amp; OCR to extract the text automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <footer className="pointer-events-none sticky bottom-8">
              <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-6 py-5 shadow-[0_28px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className={`${UI.btnSecondary} transition-all duration-200 hover:scale-[1.02]`}
                  onClick={onBack}
                  data-testid="upload-step-back"
                >
                  Back
                </button>
                <div className="flex flex-1 items-center justify-end gap-3">
                  <button
                    type="button"
                    className={`${UI.btnSecondary} hidden transition-all duration-200 hover:scale-[1.02] sm:inline-flex`}
                    onClick={() => toggle("notice")}
                    disabled={continuePending || switching}
                    data-testid="upload-step-use-ocr"
                  >
                    Use OCR
                  </button>
                  <button
                    type="button"
                    className={`${UI.btnPrimary} min-w-[168px] transition-all duration-200 hover:scale-[1.02]`}
                    onClick={onContinue}
                    disabled={!!continueDisabled || continuePending || switching}
                    data-testid="upload-step-continue"
                  >
                    {continuePending ? "Working…" : "Continue"}
                  </button>
                </div>
              </div>
            </footer>

            {active === "notice" ? (
              <p className="px-2 text-xs text-slate-500">
                These details must appear on the public notice. You can refine the text before publishing.
              </p>
            ) : null}
          </div>
        }
        right={rightRail ?? null}
      />
    </section>
  );
}
