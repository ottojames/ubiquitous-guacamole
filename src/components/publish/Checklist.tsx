import React from 'react';

export type ChecklistItem = { id: string; label: string; ok: boolean; required?: boolean };

export default function Checklist({ items }: { items: ChecklistItem[] }) {
  const allOk = items.every((i) => i.ok || i.required === false);
  return (
    <div className="mb-4" role="region" aria-label="Compliance checklist">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Publication‑ready checklist</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${allOk ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {allOk ? 'All good' : 'Finish required items'}
        </span>
      </div>
      <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-2">
            <span aria-hidden className={`mt-0.5 inline-block w-2.5 h-2.5 rounded-full ${it.ok ? 'bg-green-600' : 'bg-amber-600'}`} />
            <span className={it.ok ? 'text-slate-700' : 'text-amber-800'}>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

