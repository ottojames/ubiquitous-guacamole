import React from 'react';
import * as UI from '@/styles/ui';
import type { NoticeDefinition } from '@/next/publish/config/noticeTypes';

export type PreviewIssue = {
  type: 'parse' | 'window';
  message: string;
};

export type NoticePreviewProps = {
  definition: NoticeDefinition;
  draft: Record<string, unknown> | null;
  issues: PreviewIssue[];
};

function hasDraftValues(draft: Record<string, unknown> | null): boolean {
  if (!draft) return false;
  return Object.values(draft).some((value): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') {
      return hasDraftValues(value as Record<string, unknown>);
    }
    return value !== undefined && value !== null && `${value}`.trim().length > 0;
  });
}

export default function NoticePreview({ definition, draft, issues }: NoticePreviewProps) {
  const started = hasDraftValues(draft);

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">Upload status</p>
        <h3 className="text-sm font-semibold text-neutral-800">{definition.label}</h3>
        <p className="text-xs text-neutral-500">
          {started
            ? 'Keep filling in the template to generate a preview and validate statutory text.'
            : 'Select an upload method to begin building your notice.'}
        </p>
      </header>

      <section className={`${UI.card} space-y-3 border border-neutral-200 bg-white/80 p-4 shadow-sm`}>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Checklist</div>
        <ul className="space-y-2 text-xs text-neutral-600">
          <li className="flex items-start gap-2">
            <span aria-hidden="true">•</span>
            <span>Choose whether to upload an existing notice or build it using the template builder.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden="true">•</span>
            <span>Complete the required template fields to see a live preview before confirming.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden="true">•</span>
            <span>We'll check deadlines and window rules automatically once the preview is generated.</span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-dashed border-neutral-200 bg-white/70 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Issues</h4>
        {issues.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-500">
            No issues detected yet. Finish filling in the template to run validations.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-neutral-600">
            {issues.map((issue, index) => (
              <li key={`${issue.type}-${index}`} className="leading-5">
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
