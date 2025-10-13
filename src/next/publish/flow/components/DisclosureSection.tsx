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
      className="group rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 open:border-blue-200 open:shadow-[0_16px_40px_rgba(37,99,235,0.1)]"
    >
      <summary className="cursor-pointer select-none list-none px-6 py-5 text-lg font-bold tracking-tight text-slate-900 transition-colors duration-200 hover:text-blue-700">
        {title}
      </summary>
      <div className="px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}
