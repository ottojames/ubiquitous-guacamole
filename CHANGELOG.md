## Publish Wizard Stabilization

- src/wizard/wizardSteps.ts: centralize wizard step metadata for UI and routing
- src/wizard/WizardStepper.tsx: render single accessible progress stepper
- src/wizard/useSafeTransition.ts, src/wizard/draftStore.ts, src/wizard/requireDraft.ts: add safe async navigation helpers and draft persistence utilities
- src/next/publish/flow/NewPublishFlow.tsx: adopt new stepper, deterministic draft handling, and safe transitions
- src/next/publish/flow/steps/*.tsx: align step content with updated accessibility, layout, and design requirements
- src/next/publish/flow/TemplateBuilderForm.tsx: restructure fields into responsive grid with labelled inputs
- src/next/publish/flow/__tests__/UploadMethodStep.test.tsx: add RTL coverage for OCR open race condition
- e2e/publish/wizard.spec.ts: add end-to-end coverage for wizard navigation scenarios
- src/wizard/wizardSteps.test.ts: verify wizard step contract
- src/components/__tests__/NoticeTypeSelect.test.tsx, src/components/__tests__/PublishLayout.test.tsx, src/components/__tests__/PreviewTemplate.test.tsx, src/pages/__tests__/PublishTabs.test.tsx: update legacy tests to exercise new flow and router mocks
- src/next/publish/templates/templates.test.ts: freeze system time to stabilize snapshots
