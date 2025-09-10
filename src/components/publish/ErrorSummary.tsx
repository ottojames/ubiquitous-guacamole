import React from 'react';

export default function ErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="mb-4 border-l-4 border-rose-600 bg-rose-50 p-4" role="alert" aria-labelledby="error-summary-title">
      <h2 id="error-summary-title" className="font-medium text-rose-700 mb-2">There is a problem</h2>
      <ul className="list-disc pl-5 text-sm text-rose-700">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
