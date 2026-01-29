export const wizardSteps = [
  { id: 1, key: "notice-type", path: "/publish/step-1", title: "Type" },
  { id: 2, key: "upload-ocr", path: "/publish/step-2", title: "Upload" },
  { id: 3, key: "confirm-data", path: "/publish/step-3", title: "Details" },
  { id: 4, key: "pay", path: "/publish/step-4", title: "Review & pay" },
] as const;

export type WizardStep = (typeof wizardSteps)[number];

export function getWizardStepByPath(pathname: string): WizardStep {
  const match = wizardSteps.find((step) => pathname.startsWith(step.path));
  return match ?? wizardSteps[0];
}
