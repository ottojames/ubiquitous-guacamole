import React from 'react';
import * as UI from '@/styles/ui';
/* CN:STEP2-COMPLIANCE-START */
/* CN:FIX-START */
/* CN:STEP2-COMPLIANCE-UPGRADE-START */
import { calculateRepresentationDeadline } from '@/lib/dates/licensing';
/* CN:TEMPLATES-PREVIEW-START */
/* CN:LICENSING-TEMPLATES-START */
import { formatDisplayDate } from '@/lib/format';
/* CN:LICENSING-TEMPLATES-END */
/* CN:TEMPLATES-PREVIEW-END */
/* CN:STEP2-COMPLIANCE-UPGRADE-END */
/* CN:FIX-END */
/* CN:STEP2-COMPLIANCE-END */

export default function KeyDatesCard({
  applicationDate,
  representationDeadline,
}: {
  applicationDate: string;
  representationDeadline: string;
  consultationDays: number;
}) {
  /* CN:STEP2-START */
  const hasSubmission = !!applicationDate;
  // {/* CN:LICENSING-FINAL-START */}
  /* CN:OFFICER-FINAL-START */
  const submissionIso = hasSubmission ? `${applicationDate}T00:00:00` : '';
  const submissionDisplay = hasSubmission ? formatDisplayDate(submissionIso) : '';
  // {/* CN:LICENSING-FINAL-END */}
  const derivedDeadline = React.useMemo(() => {
    if (representationDeadline) return representationDeadline;
    if (!applicationDate) return '';
    const computed = calculateRepresentationDeadline(applicationDate);
    return Number.isNaN(computed.getTime()) ? '' : computed.toISOString();
  }, [applicationDate, representationDeadline]);
  /* CN:FIX-START */
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  const deadlineDisplay = derivedDeadline ? formatDisplayDate(derivedDeadline) : '';
  const submissionPlaceholder = 'Set in Step 2';
  const deadlinePlaceholder = 'Set in Step 2';
  /* CN:OFFICER-FINAL-END */
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  /* CN:FIX-END */

  return (
    <div className={`${UI.card} ${UI.cardHover} p-4 md:p-5`} aria-label="Key dates">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-900">Key dates</h3>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          title="Per Licensing Act 2003"
          aria-label="Why these dates?"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 9v4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 6h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <dl className="space-y-3 text-sm text-[#192650]">
        <div className="flex items-start justify-between gap-4">
          <dt className="font-medium">Application date</dt>
          <dd className="font-semibold">
            {/* CN:LICENSING-FINAL-START */}
            {hasSubmission ? (
              <time dateTime={submissionIso} className="font-semibold">
                {submissionDisplay}
              </time>
            ) : (
              <span className="text-xs font-normal text-slate-500">{submissionPlaceholder}</span>
            )}
            {/* CN:LICENSING-FINAL-END */}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="font-medium">Representation deadline</dt>
          <dd className="text-right font-semibold">
            {/* CN:LICENSING-FINAL-START */}
            <div>
              {derivedDeadline ? (
                <time dateTime={derivedDeadline} className="font-semibold">
                  {deadlineDisplay}
                </time>
              ) : (
                <span className="text-xs font-normal text-slate-500">{deadlinePlaceholder}</span>
              )}
            </div>
            {/* CN:LICENSING-FINAL-END */}
            <span className="block text-xs font-normal text-slate-500">Licensing Act 2003</span>
          </dd>
        </div>
      </dl>
    </div>
  );
  /* CN:STEP2-END */
}
