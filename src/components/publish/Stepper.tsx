import React from 'react';
import { motion } from 'framer-motion';

export type StepperProps = {
  steps?: readonly string[];
  currentStep?: number;
  onStepChange?: (i: number) => void;
};

export default function Stepper({ steps = [], currentStep = 0, onStepChange }: StepperProps) {
  const count = steps.length;
  const clampedCurrent = Math.min(Math.max(currentStep, 0), Math.max(0, count - 1));
  const progress = count > 0 ? ((clampedCurrent + 1) / count) * 100 : 0;

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
            onClick={() => onStepChange?.(i)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${clampedCurrent === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            aria-current={clampedCurrent === i}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
    </div>
  );
}
