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

export type PreviewNoticeProps = {
  draft: PublishState;
  authority: Authority | null;
  ocrText: string;
  onReplaceOcr: (next: string) => void;
};

const SOURCE_OPTIONS: Array<{ value: 'ocr' | 'structured'; label: string }> = [
  { value: 'ocr', label: 'OCR text' },
  { value: 'structured', label: 'Structured fields' },
];

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
  const [source, setSource] = React.useState<'ocr' | 'structured'>(hasOcr ? 'ocr' : 'structured');
  const prevHasOcr = React.useRef(hasOcr);

  React.useEffect(() => {
    if (hasOcr && !prevHasOcr.current) {
      setSource('ocr');
    }
    if (!hasOcr) {
      setSource('structured');
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

  const previewText = source === 'structured' ? structuredPreview : ocrText;
  /* CN:OFFICER-FINAL-START */
  const hasContent = previewText.trim().length > 0;
  const previewIsEmpty = !hasContent;
  /* CN:OFFICER-FINAL-END */

  const lines = React.useMemo(() => previewText.split(/\r?\n/), [previewText]);
  const headingOne = lines[0]?.trim();
  const headingTwo = lines[1]?.trim();
  const bodyLines = React.useMemo(() => {
    const rest = lines.slice(2);
    return rest;
  }, [lines]);

  const copy = React.useCallback(async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard?.writeText(previewText);
    } catch {
      /* noop */
    }
  }, [hasContent, previewText]);

  const download = React.useCallback(() => {
    if (!hasContent) return;
    const blob = new Blob([previewText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [hasContent, previewText]);

  const handleReplace = React.useCallback(() => {
    if (!structuredReplacement.trim()) return;
    const confirmed = window.confirm('Replace OCR text with structured text? This will overwrite the scanned notice text.');
    if (!confirmed) return;
    onReplaceOcr(structuredReplacement);
    setSource('ocr');
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
  const contactEmail = trimmed(authority?.repsEmail) || trimmed(draft.councilEmail);
  const contactUrl = trimmed(authority?.repsUrl);
  const contactPostal = trimmed(authority?.postalAddress) || trimmed(draft.councilAddress);
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
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h3 className="text-[13px] font-medium text-slate-700">Preview</h3>
          <p className="mt-1 text-xs text-slate-600">Generated as you type</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div role="radiogroup" aria-label="Preview source" className="inline-flex rounded-full border border-slate-300 bg-white p-0.5 text-xs font-medium text-[#192650]">
            {SOURCE_OPTIONS.map((opt) => {
              const active = source === opt.value;
              const disabled = opt.value === 'ocr' && !hasOcr;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => setSource(opt.value)}
                  className={`rounded-full px-3 py-1 transition ${
                    active ? 'bg-[#192650] text-white shadow-sm' : 'text-[#192650]'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleReplace}
            disabled={!structuredReplacement.trim()}
            className={`${UI.btnSecondary} h-9 px-3 text-xs`}
          >
            Replace OCR with structured text
          </button>
        </div>
      </div>
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
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-slate-200/70" />
            <div className="h-3 w-11/12 rounded bg-slate-200/70" />
            <div className="h-3 w-9/12 rounded bg-slate-200/70" />
            <div className="h-3 w-7/12 rounded bg-slate-200/70" />
          </div>
        ) : (
          <div className={`${UI.prose} prose-p:my-2`}>
            {headingOne && <h4 className="mt-0 text-sm font-semibold tracking-wide text-[#192650]">{headingOne.toUpperCase()}</h4>}
            {headingTwo && <p className="-mt-2 text-[13px] font-medium text-slate-700">{headingTwo}</p>}
            {bodyLines.map((line, index) =>
              line.trim() ? (
                <p key={index} className="text-[14px] leading-6 text-slate-800 whitespace-pre-wrap">
                  {line}
                </p>
              ) : (
                <p key={index} className="text-[14px] leading-6 text-slate-800">&nbsp;</p>
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
    </div>
  );
}
// {/* CN:LICENSING-FINAL-END */}
