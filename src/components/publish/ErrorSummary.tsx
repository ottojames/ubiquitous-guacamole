import React from 'react';
import * as UI from '@/styles/ui';

export type ErrorItem = { field: string; message: string };

export default function ErrorSummary({ errors }: { errors: ErrorItem[] }) {
  if (!errors.length) return null;
  return (
    <div
      className={UI.card + ' mb-4 border-red-200 bg-red-50 p-4 text-red-800'}
      role="alert"
      aria-labelledby="error-summary-title"
    >
      <h2 id="error-summary-title" className="mb-2 font-semibold">
        There is a problem
      </h2>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {errors.map((e) => (
          <li key={e.field}>
            <a
              href={`#${e.field}`}
              onClick={(ev) => {
                ev.preventDefault();
                const el = document.getElementById(e.field) as HTMLElement | null;
                el?.focus();
                el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
