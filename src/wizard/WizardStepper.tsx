import * as React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { wizardSteps, type WizardStep } from "./wizardSteps";

type WizardStepperProps = {
  currentPath: string;
  guards?: Partial<Record<WizardStep["key"], boolean>>;
  hrefs?: Partial<Record<WizardStep["key"], string>>;
};

export function WizardStepper({ currentPath, guards, hrefs }: WizardStepperProps) {
  // Determine which step is current and completed
  const currentStepIndex = wizardSteps.findIndex(step => currentPath.startsWith(step.path));

  return (
    <nav aria-label="Steps">
      <ol className="flex flex-wrap items-center rounded-full border border-slate-200/60 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-500 shadow-lg backdrop-blur">
        {wizardSteps.map((step, index) => {
          const target = hrefs?.[step.key] ?? step.path;
          const isCurrent = currentPath.startsWith(step.path);
          const isCompleted = currentStepIndex > index;
          const enabled = guards?.[step.key] ?? step.id === 1;

          const base = isCurrent
            ? "bg-blue-600 text-white shadow-md"
            : isCompleted
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : enabled
            ? "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            : "text-slate-400";

          const content = (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-200 ${base}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent ? "bg-white/20" : isCompleted ? "bg-blue-600 text-white" : "bg-slate-100"
              }`}>
                {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.id}
              </span>
              <span className="text-sm font-semibold">{step.title}</span>
            </span>
          );

          const isLastStep = index === wizardSteps.length - 1;

          if (!enabled) {
            return (
              <React.Fragment key={step.id}>
                <li aria-disabled="true" className="opacity-70">
                  {content}
                </li>
                {!isLastStep && (
                  <div className="mx-1 h-px w-8 bg-slate-200" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={step.id}>
              <li>
                <Link
                  to={target}
                  aria-current={isCurrent ? "step" : undefined}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {content}
                </Link>
              </li>
              {!isLastStep && (
                <div className={`mx-1 h-px w-8 transition-colors duration-200 ${
                  isCompleted ? "bg-blue-400" : "bg-slate-200"
                }`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export default WizardStepper;
