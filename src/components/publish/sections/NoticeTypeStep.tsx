import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as UI from '@/styles/ui';
import type { NoticeType } from '@/types/notice';

export const LICENSING_NOTICE_TYPES = ['premises', 'variation', 'review'] as const;
export type LicensingNoticeType = (typeof LICENSING_NOTICE_TYPES)[number];
export const isLicensingNoticeType = (value: unknown): value is LicensingNoticeType =>
  LICENSING_NOTICE_TYPES.includes(value as LicensingNoticeType);

type Props = {
  value?: NoticeType;
  onChange: (t: NoticeType) => void;
  onContinue: () => void;
  suppressInlineHelp?: boolean;
};

type Option = {
  value: LicensingNoticeType;
  label: string;
  descriptor: string;
};

const OPTIONS: Option[] = [
  {
    value: 'premises',
    label: 'Premises Licence — Licensing Act 2003',
    descriptor: 'Alcohol/regulated entertainment & late-night refreshment.',
  },
  {
    value: 'variation',
    label: 'Variation of Premises Licence — Licensing Act 2003',
    descriptor: 'Changes to hours/conditions/layout, etc.',
  },
  {
    value: 'review',
    label: 'Review of Premises Licence — Licensing Act 2003',
    descriptor: 'Application to review an existing licence.',
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
    const handlePointerDown = (event: MouseEvent | PointerEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!panelRef.current || panelRef.current.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [open]);

  return { open, setOpen, panelRef, buttonRef };
}

const NoticeTypeStep = forwardRef<HTMLSelectElement, Props>(
  ({ value, onChange, onContinue, suppressInlineHelp = false }, ref) => {
    const selectId = useId();
    const helperId = useId();
    const errorId = useId();
    const tooltipId = useId();
    const { open, setOpen, panelRef, buttonRef } = useTooltipControls();
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const [touched, setTouched] = useState(false);

    const licensingValue = isLicensingNoticeType(value) ? value : '';
    const isValid = licensingValue !== '';

    const descriptor = useMemo(() => {
      if (!licensingValue) return undefined;
      return OPTIONS.find((option) => option.value === licensingValue)?.descriptor;
    }, [licensingValue]);

    const hasError = touched && !isValid;
    const describedBy = [descriptor ? helperId : undefined, hasError ? errorId : undefined]
      .filter(Boolean)
      .join(' ');

    useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement | null);

    useEffect(() => {
      if (!suppressInlineHelp) return;
      if (!open) return;
      setOpen(false);
    }, [open, setOpen, suppressInlineHelp]);

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value as LicensingNoticeType | '';
      if (!nextValue) {
        setTouched(false);
        return;
      }
      setTouched(false);
      onChange(nextValue as NoticeType);
    };

    const handleContinue = () => {
      if (!isValid) {
        setTouched(true);
        selectRef.current?.focus();
        return;
      }
      onContinue();
    };

    return (
      <>
        {/* CN:STEP1-START */}
        <section className={UI.card + ' p-5 md:p-6'} data-testid="notice-type-step">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Confirm Notice Type</h2>
            {!suppressInlineHelp && (
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
                  <span aria-hidden="true" className="text-sm font-semibold">
                    i
                  </span>
                </button>
                {open && (
                  <div
                    id={tooltipId}
                    role="tooltip"
                    ref={panelRef}
                    tabIndex={-1}
                    className="absolute right-0 z-20 mt-2 w-72 max-w-xs rounded-xl border border-brand-blue/20 bg-white p-4 text-sm text-brand-navy shadow-[0_10px_28px_rgba(25,38,80,0.14)]"
                  >
                    <p>
                      Choose the exact Licensing Act 2003 category. This controls the required wording and deadlines later.
                    </p>
                    <a
                      href="/docs/licensing-act-2003/premises-notices"
                      className="mt-3 inline-flex items-center font-medium text-[#2563EB] hover:underline"
                    >
                      Read the guidance
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <label htmlFor={selectId} className={UI.label}>
              Notice type
            </label>
            <select
              id={selectId}
              ref={selectRef}
              className={`${UI.input} w-full bg-white text-[#0f172a] focus:ring-offset-transparent`}
              value={licensingValue}
              onChange={handleSelectChange}
              aria-invalid={hasError}
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
            {hasError && (
              <p id={errorId} className="text-sm text-red-600">
                Select a notice type to continue.
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className={`${UI.btnPrimary} ${!isValid ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={handleContinue}
              data-testid="btn-continue-step1"
              aria-disabled={!isValid}
            >
              Continue
            </button>
          </div>
        </section>
        {/* CN:STEP1-END */}
      </>
    );
  }
);

export default NoticeTypeStep;
