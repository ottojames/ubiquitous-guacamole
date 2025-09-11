import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as UI from '@/styles/ui';

export type ChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  target?: string;
  severity?: 'error' | 'warning';
  rationale?: string;
};

type Props =
  | { items: ChecklistItem[]; onFix?: (target?: string) => void }
  | { issues: string[]; onFix?: (target?: string) => void };

export default function Checklist(props: Props) {
  const items: ChecklistItem[] = 'items' in props
    ? props.items
    : props.issues.map((label, i) => ({ id: String(i), label, ok: false }));
  const onFix = 'onFix' in props ? props.onFix : undefined;

  const prev = useRef<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const turnedGreen = items.filter((i) => i.ok && prev.current[i.id] === false);
    if (turnedGreen.length > 0) {
      setAnnouncement(`${turnedGreen[0].label} resolved`);
    }
    items.forEach((i) => {
      prev.current[i.id] = i.ok;
    });
  }, [items]);

  const handleFix = (target?: string) => {
    if (onFix) {
      onFix(target);
      return;
    }
    if (!target) return;
    const el = document.getElementById(target) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
  };

  const allGood = items.every((i) => i.ok);

  return (
    <div className={UI.card + ' p-5'} role="region" aria-label="Compliance checklist">
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-brand-navy">Compliance checklist</h3>
      <ul className="space-y-2 text-sm">
        <AnimatePresence initial={false}>
          {allGood && (
            <motion.li
              layout
              key="all-good"
              className="flex items-center gap-2 text-green-700"
            >
              <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white text-[10px]">✔</span>
              All checks passed — ready to publish
            </motion.li>
          )}
          {!allGood &&
            items.map((item) => (
              <motion.li
                layout
                key={item.id}
                className={`flex items-center justify-between ${item.ok ? 'text-green-700' : 'text-red-700'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${item.ok ? 'bg-green-600 text-white' : item.severity === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'}`}
                  >
                    {item.ok ? '✔' : '✘'}
                  </span>
                  <div>
                    <div>{item.label}</div>
                    {!item.ok && item.rationale && (
                      <div className="text-xs text-brand-slate" data-testid="rationale">{item.rationale}</div>
                    )}
                  </div>
                </div>
                {!item.ok && (
                  <button
                    className="ml-4 rounded-md border px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                    onClick={() => handleFix(item.target)}
                  >
                    Fix this
                  </button>
                )}
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

