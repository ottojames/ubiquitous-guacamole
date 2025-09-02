import React from 'react';
import SiteHeader from '../components/SiteHeader';

export default function Success() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)',
      }}
    >
      <SiteHeader />
      <main className="flex-1 max-w-xl mx-auto py-20 px-4 text-center">
        <div className="bg-white/95 rounded-2xl ring-1 ring-slate-200 shadow p-8">
          <h1 className="text-2xl font-semibold mb-4">Notice saved</h1>
          <p className="text-slate-700 mb-6">
            Your notice has been saved as a draft. Check your email for next steps.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Return home
          </a>
        </div>
      </main>
    </div>
  );
}
