import React from 'react';
import Stepper from './Stepper';
import * as UI from '@/styles/ui';

type AppShellProps = {
  title: string;
  steps?: readonly string[];
  currentStep?: number;
  onStepChange?: (i: number) => void;
  rail: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AppShell({ title, steps, currentStep, onStepChange, rail, children, footer }: AppShellProps) {
  return (
    <div className={`${UI.pageWrap} relative`}>
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-slate-200">
        <div className={`${UI.container} py-3`}>
          <div className="flex items-center justify-between">
            <div className="text-slate-900 font-semibold">Public Notice Portal</div>
            <nav className="text-sm text-slate-600">Help</nav>
          </div>
        </div>
      </header>

      <div className={`${UI.container} ${UI.sectionY}`}>
        <div className={`${UI.card} ${UI.cardHover}`}>
          <div className="p-6 md:p-8 border-b border-slate-200">
            <h1 className={`${UI.h2}`}>{title}</h1>
            <div className="mt-4">
              {steps && steps.length > 0 && (
                <Stepper steps={steps} currentStep={currentStep} onStepChange={onStepChange} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8">
            <main className="md:col-span-8 space-y-6">
              {children}
            </main>
            <aside className="md:col-span-4">
              {rail}
            </aside>
          </div>
          {footer && (
            <div className="px-6 md:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
