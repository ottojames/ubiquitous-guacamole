import React from 'react';
import type { ErrorItem } from '../ErrorSummary';

export default function ComplianceCard({ issues }: { issues: ErrorItem[] }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm mt-4" aria-label="Compliance checklist">
      <h3 className="font-medium mb-2">Compliance</h3>
      <ul className="list-disc pl-5 text-sm">
        {issues.length ? (
          issues.map((i) => (
            <li key={i.field}>
              {i.message}{' '}
              <a
                href={`#${i.field}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(i.field) as HTMLElement | null;
                  el?.focus();
                  el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                }}
                className="underline text-blue-700"
              >
                Fix
              </a>
            </li>
          ))
        ) : (
          <li>No issues</li>
        )}
      </ul>
    </div>
  );
}
