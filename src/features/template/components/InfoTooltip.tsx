import React from 'react';

type InfoTooltipProps = {
  content: React.ReactNode;
  label?: string;
  id?: string;
};

export default function InfoTooltip({ content, label = 'More information', id }: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = id ?? React.useId();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | PointerEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        ref={buttonRef}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span aria-hidden>i</span>
        <span className="sr-only">{label}</span>
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          ref={panelRef}
          tabIndex={-1}
          className="absolute z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 shadow-lg"
        >
          {content}
        </div>
      )}
    </div>
  );
}
