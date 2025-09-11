import React from 'react';

export type ErrorItem = { field: string; message: string };

export default function ErrorSummary({ errors }: { errors: ErrorItem[] }) {
  if (!errors.length) return null;
  return (
    <div
      className="mb-4 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 p-4"
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
              className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
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
