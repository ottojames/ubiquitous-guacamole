import React from "react";

type StickyRailLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

export default function StickyRailLayout({ left, right }: StickyRailLayoutProps) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
      <div>{left}</div>
      <aside
        className="sticky top-6 hidden space-y-5 text-slate-600/95 lg:block"
        aria-label="Preview and guidance"
      >
        {right}
      </aside>
      <div className="mt-10 space-y-4 lg:hidden">
        <details className="group rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Preview & guidance
          </summary>
          <div className="border-t border-slate-200/70 bg-white/90 p-4">
            <div className="space-y-4">{right}</div>
          </div>
        </details>
      </div>
    </div>
  );
}
