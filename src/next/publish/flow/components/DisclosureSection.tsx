import React from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  open?: boolean;
  onToggle?: (event: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
  children: React.ReactNode;
  testId?: string;
  /** Optional icon to display before the title */
  icon?: string;
  /** Optional count badge (e.g., number of items in category) */
  count?: number;
};

/**
 * Polished <details> wrapper used across the wizard.
 * - Border + subtle shadow
 * - Clickable summary with optional icon and count
 * - Smooth open state (via Tailwind `open:` utilities)
 * - Accessible keyboard navigation
 */
export default function DisclosureSection({
  title,
  open = false,
  onToggle,
  children,
  testId,
  icon,
  count,
}: Props) {
  return (
    <details
      open={open}
      onToggle={onToggle}
      data-testid={testId}
      className="group rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 open:border-blue-200 open:shadow-[0_16px_40px_rgba(37,99,235,0.1)]"
    >
      <summary
        className="flex cursor-pointer select-none list-none items-center justify-between gap-4 px-6 py-5 text-lg font-bold tracking-tight text-slate-900 transition-colors duration-200 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-2xl"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-2xl" role="img" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{title}</span>
          {count !== undefined && (
            <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors duration-200 group-open:bg-blue-100 group-open:text-blue-700">
              {count} {count === 1 ? 'type' : 'types'}
            </span>
          )}
        </div>
        <ChevronDown
          className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}
