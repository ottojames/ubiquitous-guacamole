import React from 'react';

export type ErrorItem = { field: string; message: string };

export default function ErrorSummary({ errors }: { errors: ErrorItem[] }) {
  if (!errors.length) return null;
  return (
    <div
      className="mb-4 border-l-4 border-rose-600 bg-rose-50 p-4"
      role="alert"
      aria-labelledby="error-summary-title"
    >
      <h2 id="error-summary-title" className="font-medium text-rose-700 mb-2">
        There is a problem
      </h2>
      <ul className="list-disc pl-5 text-sm text-rose-700">
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
