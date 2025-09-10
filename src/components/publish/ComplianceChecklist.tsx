import React from 'react';

export type ChecklistProps = { issues: string[]; onFix: () => void };

export default function Checklist({ issues, onFix }: ChecklistProps) {
  const hasIssues = (issues?.length || 0) > 0;
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm" role="region" aria-label="Publication-ready checklist">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Publication-ready checklist</h3>
        {hasIssues && (
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm"
            onClick={onFix}
          >
            Fix first issue
          </button>
        )}
      </div>
      <ul className="space-y-1 text-sm">
        {!hasIssues && (
          <li className="flex items-center gap-2 text-emerald-700">
            <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
            All checks passed — ready to publish
          </li>
        )}
        {issues?.map((msg, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-slate-800">{msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
