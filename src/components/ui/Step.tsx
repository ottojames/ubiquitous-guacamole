import React, { PropsWithChildren, useState } from "react";

type StepProps = PropsWithChildren<{
  title: string;
  defaultOpen?: boolean;
  required?: boolean;
  subtitle?: string;
}>;

export function Step({ title, subtitle, defaultOpen = true, children }: StepProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4 rounded-xl border bg-white/95 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        </div>
        <span className="text-slate-500">{open ? "▴" : "▾"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}
