import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

export default function Success() {
  const [searchParams] = useSearchParams();
  const noticeId = searchParams.get('noticeId');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)',
      }}
    >
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-white/95 rounded-2xl ring-1 ring-slate-200 shadow-lg p-10">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Notice published successfully!
          </h1>

          <div className="space-y-4 text-left max-w-md mx-auto mb-8">
            <p className="text-slate-700">
              ✓ Your notice has been successfully submitted and is now live on the portal.
            </p>
            <p className="text-slate-700">
              ✓ A confirmation email has been sent with your notice details and reference number.
            </p>
            {noticeId && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="font-semibold">Notice ID:</span>{' '}
                <code className="text-blue-600">{noticeId}</code>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              Return home
            </a>
            <a
              href="/notices"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View all notices
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
