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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main content: full width on mobile, 7 cols on desktop */}
      <div className="lg:col-span-7">{left}</div>

      {/* Right rail: Always visible, sticky on desktop */}
      <aside
        className="sticky top-6 h-fit space-y-4 lg:col-span-5"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        aria-label="Preview and guidance"
      >
        <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'inherit' }}>
          {right}
        </div>
      </aside>
    </div>
  );
}
