import React from 'react';
import { motion } from 'framer-motion';
import * as UI from '@/styles/ui';

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
    <div aria-label="Steps" className="space-y-4">
      <div className={`relative overflow-hidden ${UI.stepperTrack}`}>
        <motion.div
          className={UI.stepperFill}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStepChange?.(i)}
              className={`${UI.stepDotBase} ${clampedCurrent === i ? UI.stepDotActive : ''}`}
              aria-current={clampedCurrent === i}
              aria-label={`Step ${i + 1}: ${s}`}
            >
              <span className="text-[12px] font-semibold text-[#192650]">{i + 1}</span>
            </button>
            <button
              type="button"
              onClick={() => onStepChange?.(i)}
              className={`text-sm transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white ${clampedCurrent === i ? 'text-[#192650] font-medium' : 'text-slate-600 hover:text-slate-800'}`}
            >
              {i + 1}. {s}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
