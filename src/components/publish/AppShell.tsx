import React from 'react';
import Stepper from './Stepper';

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
    <div className="min-h-screen bg-gradient-to-br from-[#192650] via-[#3866af] to-white">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-screen-lg px-6 md:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="text-slate-900 font-semibold">Public Notice Portal</div>
            <nav className="text-sm text-slate-600">Help</nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-lg px-6 md:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
          <div className="p-6 md:p-8 border-b border-slate-200">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
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
