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
      <div className="flex items-center justify-between">
        {items.map((l, i) => {
          const idx = i + 1 as 1 | 2 | 3 | 4;
          const state = idx < step ? 'completed' : idx === step ? 'current' : 'upcoming';
          const active = state === 'current';
          return (
            <div key={i} className="flex items-center gap-x-3 md:gap-x-4">
              <div className={`${UI.stepDotBase} ${active ? UI.stepDotActive : ''}`} aria-current={active} aria-label={`Step ${idx}`} />
              <span
                className={`text-sm ${active ? 'text-white/90 font-medium' : 'text-white/90'}`}
                data-testid={`progress-label-${i}`}
                data-state={state}
              >
                {l}
              </span>
            </div>
          );
        })}
      </div>
      {/* Track under the dots */}
      <div className="mt-3 relative h-1">
        <div className={`absolute inset-0 ${UI.stepperTrack}`} />
        <div className={`absolute inset-y-0 left-0 ${UI.stepperFill}`} style={{ width: percent }} aria-hidden="true" />
      </div>
    </div>
  );
}
