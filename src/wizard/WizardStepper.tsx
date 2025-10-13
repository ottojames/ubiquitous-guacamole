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
    <nav aria-label="Progress steps" className="flex items-center">
      <ol className="flex items-center gap-3">
        {wizardSteps.map((step, index) => {
          const target = hrefs?.[step.key] ?? step.path;
          const isCurrent = currentPath.startsWith(step.path);
          const isCompleted = currentStepIndex > index;
          const enabled = guards?.[step.key] ?? step.id === 1;
          const isLastStep = index === wizardSteps.length - 1;

          const stepContent = (
            <div className="flex items-center gap-2">
              {/* Compact Step Circle */}
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
                isCurrent
                  ? "border-white bg-white text-blue-600 shadow-lg"
                  : isCompleted
                  ? "border-white/60 bg-white/80 text-blue-600"
                  : enabled
                  ? "border-white/40 bg-white/20 text-white/80 hover:border-white/60"
                  : "border-white/20 bg-white/10 text-white/40"
              }`}>
                {isCompleted ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <span className="text-xs font-bold">
                    {step.id}
                  </span>
                )}
              </div>

              {/* Compact Label - only show for current/completed */}
              {(isCurrent || isCompleted) && (
                <span className={`text-xs font-semibold transition-colors duration-200 ${
                  isCurrent ? "text-white" : "text-white/80"
                }`}>
                  {step.title}
                </span>
              )}
            </div>
          );

          const connector = !isLastStep && (
            <div className="flex items-center px-2">
              <div className={`h-px w-6 transition-all duration-300 ${
                isCompleted ? "bg-white/60" : "bg-white/20"
              }`} aria-hidden="true" />
            </div>
          );

          if (!enabled) {
            return (
              <React.Fragment key={step.id}>
                <li aria-disabled="true" className="opacity-50">
                  {stepContent}
                </li>
                {connector}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={step.id}>
              <li>
                <Link
                  to={target}
                  aria-current={isCurrent ? "step" : undefined}
                  className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-lg"
                >
                  {stepContent}
                </Link>
              </li>
              {connector}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export default WizardStepper;
