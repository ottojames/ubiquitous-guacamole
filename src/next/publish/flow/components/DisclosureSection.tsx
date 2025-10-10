import React from 'react';

export type DisclosureSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export default function DisclosureSection({
  title,
  open,
  onToggle,
  children,
}: DisclosureSectionProps) {
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-6 text-left hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span
          className={`transition-transform text-neutral-500 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        >
          ▼
        </span>
      </button>
      {open && <div className="border-t border-neutral-200 px-4 py-4 sm:px-6">{children}</div>}
    </div>
  );
}
