// {/* CN:LICENSING-FINAL-START */}
import React from 'react';
import type { Authority } from '@/lib/authorities';
import * as UI from '@/styles/ui';
import {
  type PublishState,
  buildPremisesNotice,
  buildVariationNotice,
  buildReviewNotice,
} from './previewBuilders';
/* CN:GUARDRAIL-FINAL-START */
import { toast, useToastController } from '@/lib/ui/toast';
/* CN:GUARDRAIL-FINAL-END */
import { sanitiseNoticeText } from '@/lib/text/sanitiseNotice';

export type PreviewNoticeProps = {
  draft: PublishState;
  authority: Authority | null;
  ocrText: string;
  onReplaceOcr: (next: string) => void;
};

/* CN:GUARDRAIL-FINAL-START */
// Source toggle options configured inline to support final guardrail behavior.
/* CN:GUARDRAIL-FINAL-END */

const buildStructuredNotice = (
  draft: PublishState,
  authority: Authority | null,
  includeSummaries: boolean
) => {
  switch (draft.noticeType) {
    case 'variation':
      return buildVariationNotice(draft, authority, { includeSummaries });
    case 'review':
      return buildReviewNotice(draft, authority, { includeSummaries });
    case 'premises':
    default:
      return buildPremisesNotice(draft, authority, { includeSummaries });
  }
};

export default function PreviewNotice(props: PreviewNoticeProps) {
  const { draft, authority, ocrText, onReplaceOcr } = props;
  const hasOcr = ocrText.trim().length > 0;
  /* CN:GUARDRAIL-FINAL-START */
  const [previewSource, setPreviewSource] = React.useState<'ocr' | 'structured'>(hasOcr ? 'ocr' : 'structured');
  /* CN:GUARDRAIL-FINAL-END */
  const prevHasOcr = React.useRef(hasOcr);

  React.useEffect(() => {
    if (hasOcr && !prevHasOcr.current) {
      /* CN:GUARDRAIL-FINAL-START */
      setPreviewSource('ocr');
      /* CN:GUARDRAIL-FINAL-END */
    }
    if (!hasOcr) {
      /* CN:GUARDRAIL-FINAL-START */
      setPreviewSource('structured');
      /* CN:GUARDRAIL-FINAL-END */
    }
    prevHasOcr.current = hasOcr;
  }, [hasOcr]);

  const structuredPreview = React.useMemo(
    () => buildStructuredNotice(draft, authority, !hasOcr),
    [draft, authority, hasOcr]
  );
  const structuredReplacement = React.useMemo(
    () => buildStructuredNotice(draft, authority, true),
    [draft, authority]
  );

  /* CN:GUARDRAIL-FINAL-START */
  const structuredText = structuredPreview;
  const previewText = previewSource === 'ocr' && hasOcr ? ocrText : structuredText;
  /* CN:GUARDRAIL-FINAL-END */
  /* CN:OFFICER-FINAL-START */
  const safePreviewText = React.useMemo(() => sanitiseNoticeText(previewText), [previewText]);
  const hasContent = safePreviewText.trim().length > 0;
  const previewIsEmpty = !hasContent;
  /* CN:OFFICER-FINAL-END */
  /* CN:GUARDRAIL-FINAL-START */
  const toastMessage = useToastController();
  /* CN:GUARDRAIL-FINAL-END */

  const lines = React.useMemo(() => safePreviewText.split(/\r?\n/), [safePreviewText]);
  const headingOne = lines[0]?.trim();
  const headingTwo = lines[1]?.trim();
  const bodyLines = React.useMemo(() => {
    const rest = lines.slice(2);
    return rest;
  }, [lines]);

  const copy = React.useCallback(async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard?.writeText(safePreviewText);
      /* CN:GUARDRAIL-FINAL-START */
      toast('Copied');
      /* CN:GUARDRAIL-FINAL-END */
    } catch {
      /* noop */
    }
  }, [hasContent, safePreviewText]);

  const download = React.useCallback(() => {
    if (!hasContent) return;
    /* CN:GUARDRAIL-FINAL-START */
    const blob = new Blob([safePreviewText], { type: 'text/plain;charset=utf-8' });
    /* CN:GUARDRAIL-FINAL-END */
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [hasContent, safePreviewText]);

  const handleReplace = React.useCallback(() => {
    if (!structuredReplacement.trim()) return;
    /* CN:GUARDRAIL-FINAL-START */
    const confirmed = window.confirm('Replace OCR with structured text? This will overwrite the OCR text.');
    /* CN:GUARDRAIL-FINAL-END */
    if (!confirmed) return;
    onReplaceOcr(structuredReplacement);
    /* CN:GUARDRAIL-FINAL-START */
    setPreviewSource('ocr');
    /* CN:GUARDRAIL-FINAL-END */
  }, [structuredReplacement, onReplaceOcr]);

  const trimmed = (value?: string | null) => value?.trim() || '';
  const hasApplicant = !!trimmed(draft.applicantName);
  const hasCouncilName = !!trimmed(draft.councilName);
  const hasCouncilEmail = !!trimmed(draft.councilEmail);
  const hasAddress = !!trimmed(draft.premisesAddress);
  const hasSubmission = !!trimmed(draft.applicationDate);
  const hasDeadline = (() => {
    const value = draft.representationDeadline;
    if (!value) return false;
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }
    return value.trim().length > 0;
  })();
  const contactEmail = trimmed(draft.councilEmail) || trimmed(authority?.repsEmail);
  const contactUrl = trimmed(draft.representationsUrl) || trimmed(authority?.repsUrl);
  const contactPostal = trimmed(draft.councilAddress) || trimmed(authority?.postalAddress);
  const hasContact = !!(contactEmail || contactUrl || contactPostal);

  const needsPremisesSummary = !hasOcr && draft.noticeType === 'premises';
  const needsVariationSummary = !hasOcr && draft.noticeType === 'variation';
  const needsReviewGrounds = !hasOcr && draft.noticeType === 'review';

  const premisesSummaryOk = !needsPremisesSummary || !!trimmed(draft.applicationSummary);
  const variationSummaryOk = !needsVariationSummary || (!!trimmed(draft.applicationSummary) && !!trimmed(draft.variationSummary));
  const reviewSummaryOk = !needsReviewGrounds || !!trimmed(draft.reviewGrounds);

  const showBanner = !(
    hasApplicant &&
    hasCouncilName &&
    hasCouncilEmail &&
    hasAddress &&
    hasSubmission &&
    hasDeadline &&
    hasContact &&
    premisesSummaryOk &&
    variationSummaryOk &&
    reviewSummaryOk
  );

  return (
    <div aria-label="Notice preview" className={`${UI.card} ${UI.cardHover} relative min-h-[360px] space-y-4 p-4 md:p-5`}>
      {/* CN:SIGNOFF-START */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h3 className="text-[13px] font-medium text-slate-700">Preview</h3>
          <p className="mt-1 text-xs text-slate-600">Generated as you type</p>
        </div>
        {/* CN:SIGNOFF-START */}
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <span className="text-xs text-neutral-600">Source:</span>
          <div
            role="tablist"
            aria-label="Preview source"
            className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white"
          >
            <button
              type="button"
              role="tab"
              aria-selected={previewSource === 'ocr'}
              disabled={!hasOcr}
              onClick={() => hasOcr && setPreviewSource('ocr')}
              className={`px-2.5 py-1 text-xs font-medium transition ${
                previewSource === 'ocr' && hasOcr ? 'bg-[#192650] text-white shadow-sm' : 'text-[#192650]'
              } ${!hasOcr ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              OCR text
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewSource === 'structured'}
              onClick={() => setPreviewSource('structured')}
              className={`px-2.5 py-1 text-xs font-medium transition ${
                previewSource === 'structured' ? 'bg-[#192650] text-white shadow-sm' : 'text-[#192650]'
              }`}
            >
              Structured fields
            </button>
          </div>
          {hasOcr && (
            <button
              type="button"
              onClick={handleReplace}
              disabled={!structuredReplacement.trim()}
              className="text-xs text-[#192650] underline underline-offset-2 hover:text-[#0f1b39] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Replace OCR with structured text
            </button>
          )}
        </div>
        {/* CN:SIGNOFF-END */}
      </div>
      {/* CN:SIGNOFF-END */}
      {showBanner && (
        <div
          role="status"
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
          data-testid="preview-status"
        >
          Some fields are missing — the notice text will update as you complete the form.
        </div>
      )}
      <div id="notice-preview" className="min-h-[300px] rounded-xl border border-slate-900/5 bg-white p-4">
        {previewIsEmpty ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
            Your preview will appear here after you upload or type your notice text.
          </div>
        ) : (
          <div className={`${UI.prose} notice-preview prose-p:my-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]`}>
            {headingOne && <h4 className="mt-0 text-sm font-semibold tracking-wide text-[#192650]">{headingOne.toUpperCase()}</h4>}
            {headingTwo && <p className="-mt-2 text-[13px] font-medium text-slate-700">{headingTwo}</p>}
            {bodyLines.map((line, index) =>
              line.trim() ? (
                <p
                  key={index}
                  className="text-[14px] leading-6 text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                >
                  {line}
                </p>
              ) : (
                <p key={index} className="text-[14px] leading-6 text-slate-800 break-words [overflow-wrap:anywhere]">&nbsp;</p>
              )
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={!hasContent}
          className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            hasContent ? 'text-[#192650] hover:bg-white/60' : 'cursor-not-allowed text-slate-400'
          }`}
        >
          Copy text
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!hasContent}
          className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            hasContent ? 'text-[#192650] hover:bg-white/60' : 'cursor-not-allowed text-slate-400'
          }`}
        >
          Download .txt
        </button>
      </div>
      {/* CN:SIGNOFF-START */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 rounded-md bg-black/80 px-3 py-2 text-xs text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
      {/* CN:SIGNOFF-END */}
    </div>
  );
}
// {/* CN:LICENSING-FINAL-END */}
