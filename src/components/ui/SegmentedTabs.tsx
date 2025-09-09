import React from "react";

type SegmentedTabsProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string }[];
};

export default function SegmentedTabs<T extends string>({ value, onChange, tabs }: SegmentedTabsProps<T>) {
  return (
    <div className="inline-flex rounded-xl border bg-white/90 shadow-sm overflow-hidden">
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`px-4 py-2 text-sm font-medium ${active ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"} ${i !== 0 ? "border-l" : ""}`}
            aria-pressed={active}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
