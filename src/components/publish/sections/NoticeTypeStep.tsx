import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import * as UI from '@/styles/ui';
import type { NoticeType } from '@/types/notice';

// CN:STEP1-START
export const LICENSING_NOTICE_TYPES = ['premises', 'variation', 'review'] as const;
export type LicensingNoticeType = (typeof LICENSING_NOTICE_TYPES)[number];
export const isLicensingNoticeType = (value: unknown): value is LicensingNoticeType =>
  LICENSING_NOTICE_TYPES.includes(value as LicensingNoticeType);

type Props = {
  value?: NoticeType;
  onChange: (t: NoticeType) => void;
  error?: string;
  onResetError?: () => void;
};

type Option = {
  value: LicensingNoticeType;
  label: string;
  descriptor: string;
};

const OPTIONS: Option[] = [
  {
    value: 'premises',
    label: 'Premises Licence — Licensing Act 2003 (Alcohol/regulated entertainment & late-night refreshment)',
    descriptor: 'Licensing Act 2003 (Alcohol/regulated entertainment & late-night refreshment)',
  },
  {
    value: 'variation',
    label: 'Variation of Premises Licence — Licensing Act 2003 (Changes to hours/conditions/layout, etc.)',
    descriptor: 'Licensing Act 2003 (Changes to hours/conditions/layout, etc.)',
  },
  {
    value: 'review',
    label: 'Review of Premises Licence — Licensing Act 2003 (Application to review an existing licence)',
    descriptor: 'Licensing Act 2003 (Application to review an existing licence)',
  },
];

function useTooltipControls() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!panelRef.current || panelRef.current.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [open]);

  return { open, setOpen, panelRef, buttonRef };
}

const NoticeTypeStep = forwardRef<HTMLSelectElement, Props>(
  ({ value, onChange, error, onResetError }, ref) => {
    const selectId = useId();
    const helperId = useId();
    const errorId = useId();
    const tooltipId = useId();
    const { open, setOpen, panelRef, buttonRef } = useTooltipControls();

    const licensingValue = isLicensingNoticeType(value) ? value : undefined;

    const descriptor = useMemo(() => {
      if (!licensingValue) return undefined;
      return OPTIONS.find((option) => option.value === licensingValue)?.descriptor;
    }, [licensingValue]);

    const describedBy = [descriptor ? helperId : undefined, error ? errorId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <section className={UI.card + ' p-5 md:p-6'} data-testid="notice-type-step">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Confirm Notice Type</h2>
          <div className="relative">
            <button
              type="button"
              ref={buttonRef}
              aria-label="Read more about notice types"
              aria-expanded={open}
              aria-controls={tooltipId}
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-blue/40 text-brand-blue transition hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white"
            >
              <Info aria-hidden="true" className="h-4 w-4" />
            </button>
            {open && (
              <div
                id={tooltipId}
                role="tooltip"
                ref={panelRef}
                className="absolute right-0 z-20 mt-2 w-72 max-w-xs rounded-xl border border-brand-blue/20 bg-white p-4 text-sm text-brand-navy shadow-[0_10px_28px_rgba(25,38,80,0.14)]"
              >
                <p>Choose the exact Licensing Act 2003 category. This controls required wording and deadlines later.</p>
                <a
                  href="/docs/licensing-act-2003/premises-notices"
                  className="mt-3 inline-flex items-center font-medium text-[#2563EB] hover:underline"
                >
                  Read the guidance
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label htmlFor={selectId} className={UI.label}>
            Notice type
          </label>
          <select
            id={selectId}
            ref={ref}
            className={`${UI.input} w-full bg-white text-[#0f172a] focus:ring-offset-transparent`}
            value={licensingValue ?? ''}
            onChange={(event) => {
              onResetError?.();
              const nextValue = event.target.value as LicensingNoticeType | '';
              if (!nextValue) {
                return;
              }
              onChange(nextValue as NoticeType);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            data-testid="select-notice-type"
          >
            <option value="" disabled>
              Select a notice type…
            </option>
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {descriptor && (
            <p id={helperId} className="text-sm text-brand-gray">
              {descriptor}
            </p>
          )}
          {error && (
            <p id={errorId} className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }
);

export default NoticeTypeStep;
// CN:STEP1-END
