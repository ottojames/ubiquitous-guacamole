import React from "react";
import * as UI from "@/styles/ui";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import type { NoticeBase } from "@/types/notice";
import type { UploadMethod } from "./UploadMethodStep";
import ComplianceFeedback from "../components/ComplianceFeedback";

export type ConfirmStepProps = {
  definition: NoticeDefinition;
  notice: NoticeBase | null;
  uploadMethod: UploadMethod;
  onBack: () => void;
  onContinue: () => void;
  preview: React.ReactNode;
  metadata?: React.ReactNode;
  continueDisabled?: boolean;
  continuePending?: boolean;
  ocrText?: string;
  onOcrTextChange?: (text: string) => void;
  isPortalContext?: boolean;
  legalDetails?: Record<string, unknown>;
  // Draft generation
  onGenerateDraft?: () => void;
  draftGenerating?: boolean;
  draftSuggestions?: string[];
};

export default function ConfirmStep({
  definition,
  notice,
  uploadMethod,
  onBack,
  onContinue,
  preview,
  metadata,
  continueDisabled,
  continuePending,
  ocrText,
  onOcrTextChange,
  isPortalContext = false,
  legalDetails,
  onGenerateDraft,
  draftGenerating,
  draftSuggestions,
}: ConfirmStepProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea || !onOcrTextChange) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = ocrText?.substring(start, end) || "";

    if (!selectedText) return;

    let formattedText = selectedText;

    // Simple markdown-style formatting
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }

    const newText = (ocrText || "").substring(0, start) + formattedText + (ocrText || "").substring(end);
    onOcrTextChange(newText);

    // Restore focus and adjust selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  return (
    <section
      className="mx-auto max-w-6xl space-y-10"
      data-testid="confirm-step"
      aria-busy={continuePending ? "true" : undefined}
    >
      {/* Glass Section Header Card */}
      <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-4 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            {uploadMethod === "notice" ? "Review your notice" : "Confirm your notice"}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            {uploadMethod === "notice"
              ? "Please review the extracted text below and make any necessary corrections before continuing. This is your final chance to edit the notice."
              : "Review the generated notice and verify statutory details before continuing to payment."}
          </p>
        </div>
      </header>

      <div className="grid gap-8 sm:grid-cols-12">
        <div className="space-y-4 sm:col-span-7">
          {uploadMethod === "notice" && onOcrTextChange ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="ocr-text-edit" className="block text-sm font-semibold text-slate-900">
                  Notice text
                </label>
                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="rounded px-2 py-1 text-sm font-bold text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
                    title="Bold (wraps selection with **)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="rounded px-2 py-1 text-sm italic text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
                    title="Italic (wraps selection with *)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="rounded px-2 py-1 text-sm underline text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
                    title="Underline (wraps selection with __)"
                  >
                    U
                  </button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                id="ocr-text-edit"
                value={ocrText ?? ""}
                onChange={(e) => onOcrTextChange(e.target.value)}
                className="w-full min-h-[600px] rounded-2xl border border-slate-300 bg-white px-5 py-4 text-[15px] leading-[1.7] text-slate-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Your notice text will appear here..."
                style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
              />
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select text and use the toolbar above to apply formatting. Changes are saved automatically.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
              {preview}
            </div>
          )}
        </div>

        <aside className="space-y-5 sm:col-span-5">
          <dl className="grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-sm text-slate-700 shadow-[0_12px_36px_rgba(15,23,42,0.08)] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Notice type</dt>
              <dd className="mt-1 text-slate-600">{definition.label}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Mode</dt>
              <dd className="mt-1 text-slate-600">
                {uploadMethod === "notice" ? "Uploaded notice" : "Template builder"}
              </dd>
            </div>
            {notice?.consultation?.applicationDate ? (
              <div>
                <dt className="font-semibold text-slate-900">Application date</dt>
                <dd className="mt-1 text-slate-600">{notice.consultation.applicationDate}</dd>
              </div>
            ) : null}
            {notice?.consultation?.repsDeadline ? (
              <div>
                <dt className="font-semibold text-slate-900">Representations deadline</dt>
                <dd className="mt-1 text-slate-600">{notice.consultation.repsDeadline}</dd>
              </div>
            ) : null}
          </dl>

          {metadata ? (
            <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white/80 p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)]" role="note">
              {metadata}
            </div>
          ) : null}

          {/* Generate Draft Button - auto-generates notice text from template data */}
          {uploadMethod === "template" && notice && onGenerateDraft && (
            <div className="rounded-2xl border border-purple-200/70 bg-purple-50/50 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900">Auto-generate draft</h4>
                  <p className="mt-1 text-xs text-purple-700">
                    Generate formatted notice text from your template data with proper statutory language.
                  </p>
                  <button
                    type="button"
                    onClick={onGenerateDraft}
                    disabled={draftGenerating}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="generate-draft-button"
                  >
                    {draftGenerating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Draft
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Draft Suggestions - shows recommendations from draft generation */}
          {draftSuggestions && draftSuggestions.length > 0 && (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">Suggestions</h4>
                  <ul className="mt-2 space-y-1">
                    {draftSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Feedback - validates notice against UK statutory requirements */}
          {(notice || legalDetails) && (
            <ComplianceFeedback
              noticeData={
                notice
                  ? notice
                  : legalDetails || {}
              }
              useBaseEndpoint={!!notice}
            />
          )}
        </aside>
      </div>

      {/* Premium Sticky Action Bar */}
      <div className="sticky bottom-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-6 px-8 py-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              data-testid="confirm-step-back"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex flex-1 items-center justify-end gap-6">
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {continueDisabled ? "Review required" : "Ready to publish"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {continueDisabled
                    ? "Please verify all details are correct."
                    : isPortalContext
                    ? "Submit your notice for publication."
                    : "Proceed to payment to publish your notice."}
                </p>
              </div>
              <button
                type="button"
                onClick={onContinue}
                disabled={(continueDisabled ?? !notice) || continuePending}
                className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  (continueDisabled ?? !notice)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                }`}
                data-testid="confirm-step-continue"
              >
                {continuePending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {isPortalContext ? "Submitting..." : "Working..."}
                  </>
                ) : (
                  <>
                    {isPortalContext ? "Submit notice" : "Continue to payment"}
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPortalContext ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
