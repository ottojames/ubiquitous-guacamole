import React from "react";

type StickyRailLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

/**
 * 12-column responsive grid with sticky rail
 * Main content: ~720-760px (readable width)
 * Right rail: ~320-360px (sticky from top)
 * Gutter: 24px
 */
export default function StickyRailLayout({ left, right }: StickyRailLayoutProps) {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      {/* Main content: spans 7 columns (approx 58% of 12) */}
      <div className="lg:col-span-7">{left}</div>

      {/* Right rail: spans 5 columns (approx 42% of 12), sticky */}
      <aside
        className="sticky top-6 hidden h-fit space-y-4 lg:col-span-5 lg:block"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        aria-label="Preview and guidance"
      >
        <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'inherit' }}>
          {right}
        </div>
      </aside>

      {/* Mobile: collapsible drawer at bottom */}
      <div className="mt-8 lg:hidden">
        <details className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
            <span>Preview & guidance</span>
            <svg
              className="h-5 w-5 text-slate-400 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-200/60 bg-slate-50/50 p-5">
            <div className="space-y-4">{right}</div>
          </div>
        </details>
      </div>
    </div>
  );
}
