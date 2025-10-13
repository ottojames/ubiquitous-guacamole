import React from "react";

type Props = {
  title: string;
  open?: boolean;
  onToggle?: (event: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
  children: React.ReactNode;
  testId?: string;
};

/**
 * Polished <details> wrapper used across the wizard.
 * - Border + subtle shadow
 * - Clickable summary
 * - Smooth open state (via Tailwind `open:` utilities)
 */
export default function DisclosureSection({
  title,
  open = false,
  onToggle,
  children,
  testId,
}: Props) {
  return (
    <details
      open={open}
      onToggle={onToggle}
      data-testid={testId}
      className="group rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-all duration-200 open:border-[#2563EB]/40 open:bg-white open:shadow-[0_20px_48px_rgba(37,99,235,0.12)]"
    >
      <summary className="cursor-pointer select-none list-none px-4 py-3 text-[13px] font-semibold text-slate-800 sm:px-5 sm:py-3.5">
        {title}
      </summary>
      <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">{children}</div>
    </details>
  );
}
