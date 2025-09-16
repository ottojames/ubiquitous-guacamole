import React from 'react';
import * as UI from '@/styles/ui';

type Props = { step: 1 | 2 | 3 | 4; totalSteps?: number; labels?: string[] };

export default function ProgressBar({ step, totalSteps = 3, labels }: Props) {
  const ratio = Math.max(0, Math.min(1, (Number(step) - 1) / Math.max(totalSteps - 1, 1)));
  const percent = `${Math.round(ratio * 100)}%`;
  const defaultLabels = ['Upload your Notice', 'Confirm your Notice', 'Pay'];
  const items = Array.isArray(labels) && labels.length > 0 ? labels : defaultLabels;
  const steps = items.length;
  return (
    <div className="mb-4" data-testid="progress-bar">
      {/* CN:STEP1-START */}
      <div className="flex items-center justify-between">
        {items.map((l, i) => {
          const idx = i + 1 as 1 | 2 | 3 | 4;
          const state = idx < step ? 'completed' : idx === step ? 'current' : 'upcoming';
          const isCurrent = state === 'current';
          const isCompleted = state === 'completed';
          const dotClass = [
            UI.stepDotBase,
            'transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)]',
            isCurrent || isCompleted ? 'border-transparent bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]' : 'border-white/40 bg-white/10 text-white/60',
            isCurrent ? 'scale-105' : isCompleted ? 'opacity-100' : 'opacity-60',
          ].join(' ');
          const labelClass = `text-sm ${isCurrent ? 'font-semibold text-white' : isCompleted ? 'text-white/90' : 'text-white/60'}`;
          return (
            <div key={i} className="flex items-center gap-x-3 md:gap-x-4">
              <div
                className={dotClass}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${idx}`}
              />
              <span
                className={labelClass}
                data-testid={`progress-label-${i}`}
                data-state={state}
              >
                {l}
              </span>
            </div>
          );
        })}
      </div>
      {/* CN:STEP1-END */}
      {/* Track under the dots */}
      <div className="mt-3 relative h-1">
        <div className={`absolute inset-0 ${UI.stepperTrack}`} />
        <div className={`absolute inset-y-0 left-0 ${UI.stepperFill}`} style={{ width: percent }} aria-hidden="true" />
      </div>
    </div>
  );
}
