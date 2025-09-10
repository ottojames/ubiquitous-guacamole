import React from 'react';
import { motion } from 'framer-motion';

export default function Stepper({ steps, current, onChange }: { steps: readonly string[]; current: number; onChange?: (i: number) => void }) {
  const progress = ((current + 1) / steps.length) * 100;
  return (
    <div aria-label="Steps" className="space-y-3">
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(i)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${current === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            aria-current={current === i}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
    </div>
  );
}

