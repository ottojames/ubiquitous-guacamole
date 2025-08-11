import React from 'react';

export default function Success() {
  return (
    <main className="max-w-xl mx-auto py-20 px-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Notice saved</h1>
      <p className="text-slate-700 mb-6">
        Your notice has been saved as a draft. Check your email for next steps.
      </p>
      <a href="/" className="text-blue-600 hover:underline">
        Return home
      </a>
    </main>
  );
}
