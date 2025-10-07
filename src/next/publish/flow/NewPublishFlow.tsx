import React, { useEffect, useMemo, useState } from 'react';
import ProgressBar from '@/components/publish/ProgressBar';
import * as UI from '@/styles/ui';
import { getDefinitionById, type NoticeDefinition } from '@/next/publish/config/noticeTypes';
import type { NoticeBase } from '@/types/notice';
import NoticeTypeStep from './steps/NoticeTypeStep';
import UploadMethodStep, { type UploadMethod } from './steps/UploadMethodStep';
import ConfirmStep from './steps/ConfirmStep';
import PaymentStep from './steps/PaymentStep';
import { getNoticeBuilder } from '@/next/publish/schema/registry';
import { validateWindowRules, type WindowRuleIssue } from '@/next/publish/validation/windowRules';
import { getNoticeTemplateRenderer } from '@/next/publish/templates';
import { buildSampleDraft } from '@/next/publish/sampleData';
import { setNested } from '@/next/publish/utils/object';
import TemplateBuilderForm from './TemplateBuilderForm';
import TemplatePreview from './TemplatePreview';

const labels = ['Confirm notice type', 'Upload your notice', 'Confirm your notice', 'Pay'];

type Step = 1 | 2 | 3 | 4;

type FlowState = {
  definitionId: string | null;
  uploadMethod: UploadMethod | null;
  templateDraft: Record<string, unknown> | null;
};

const initialState: FlowState = {
  definitionId: null,
  uploadMethod: null,
  templateDraft: null,
};

export default function NewPublishFlow() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FlowState>(initialState);
  const selectedDefinition = useMemo<NoticeDefinition | null>(
    () => (state.definitionId ? getDefinitionById(state.definitionId) ?? null : null),
    [state.definitionId]
  );
  const builder = useMemo(() => {
    if (!selectedDefinition) return null;
    return getNoticeBuilder(selectedDefinition.id);
  }, [selectedDefinition?.id]);

  const templateRenderer = useMemo(() => {
    if (!selectedDefinition) return null;
    return getNoticeTemplateRenderer(selectedDefinition.templateKey);
  }, [selectedDefinition?.templateKey]);

  useEffect(() => {
    if (!selectedDefinition && step > 1) {
      setStep(1);
    }
  }, [selectedDefinition, step]);

  const handleSelectDefinition = (id: string, _definition: NoticeDefinition) => {
    setState({ definitionId: id, uploadMethod: null, templateDraft: {} });
  };

  const handleContinueFromStep1 = () => {
    if (!state.definitionId) return;
    setStep(2);
  };

  const handleUploadMethodChange = (method: UploadMethod) => {
    setState((prev) => ({
      ...prev,
      uploadMethod: method,
      templateDraft: method === 'template' ? prev.templateDraft ?? {} : prev.templateDraft,
    }));
  };

  const handleContinueFromStep2 = () => {
    if (!state.uploadMethod) return;
    setStep(3);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleBackToStep2 = () => {
    setStep(2);
  };

  const handleContinueToPayment = () => {
    setStep(4);
  };

  const handleSubmit = () => {
    // Placeholder for integration with payment/submit endpoint
    console.info('Submit notice', computedNotice);
  };

  const handleTemplatePatch = React.useCallback((patch: Record<string, unknown>) => {
    setState((prev) => ({
      ...prev,
      templateDraft: { ...(prev.templateDraft ?? {}), ...patch },
    }));
  }, []);

  const updateTemplateDraftPath = React.useCallback((path: (string | number)[], value: unknown) => {
    setState((prev) => ({
      ...prev,
      templateDraft: setNested(prev.templateDraft ?? {}, path, value),
    }));
  }, []);

  const templatePayload = useMemo(() => {
    if (!builder || state.uploadMethod !== 'template') return null;
    return {
      ...(state.templateDraft ?? {}),
      variant: selectedDefinition?.id,
    };
  }, [builder, state.uploadMethod, state.templateDraft, selectedDefinition?.id]);

  const templateParse = useMemo(() => {
    if (!builder || !templatePayload) return null;
    return builder.schema.safeParse(templatePayload);
  }, [builder, templatePayload]);

  const templateNotice: NoticeBase | null = useMemo(() => {
    if (!builder || !templateParse || !templateParse.success) return null;
    try {
      return builder.mapToNoticeBase(templateParse.data);
    } catch (error) {
      console.error('Failed to map notice', error);
      return null;
    }
  }, [builder, templateParse]);

  const templateText = useMemo(() => {
    if (!templateRenderer || !templateNotice) return null;
    try {
      return templateRenderer.renderText(templateNotice);
    } catch (error) {
      console.error('Failed to render template text', error);
      return null;
    }
  }, [templateRenderer, templateNotice]);

  const validationIssues: WindowRuleIssue[] = useMemo(() => {
    if (!templateNotice) return [];
    return validateWindowRules(templateNotice);
  }, [templateNotice]);

  const templateParseErrors = templateParse && !templateParse.success ? templateParse.error : null;

  const parseMessages = useMemo(() => {
    if (!templateParseErrors) return [] as string[];
    const flat = templateParseErrors.flatten();
    const fieldErrors = Object.values(flat.fieldErrors || {}).flat().filter(Boolean) as string[];
    return [...flat.formErrors, ...fieldErrors];
  }, [templateParseErrors]);

  const confirmMetadata = useMemo(() => {
    if (state.uploadMethod !== 'template') return null;
    if (parseMessages.length === 0 && validationIssues.length === 0) return null;
    return (
      <div className="space-y-3">
        {parseMessages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-800">Validation errors</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {parseMessages.map((message, index) => (
                <li key={`parse-error-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        {validationIssues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-800">Window rules</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {validationIssues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }, [state.uploadMethod, parseMessages, validationIssues]);

  const computedNotice: NoticeBase | null = state.uploadMethod === 'template' ? templateNotice : null;

  const sampleTemplateDraft = useMemo(() => {
    if (!selectedDefinition) return null;
    return buildSampleDraft(selectedDefinition.id);
  }, [selectedDefinition?.id]);

  const fromNoticePlaceholder = (
    <div className="p-6 text-sm text-neutral-600 space-y-3">
      <p>
        Upload capture coming soon. Drop a PDF, DOCX, or image to run OCR and auto-fill your notice.
      </p>
      <p>
        The new flow will use structured parsing, red required placeholders, and unified address lookup.
      </p>
    </div>
  );

  const templateFormContent = builder ? (
    <div className="space-y-4 p-6">
      <TemplateBuilderForm
        definition={selectedDefinition!}
        draft={state.templateDraft}
        onChange={updateTemplateDraftPath}
      />
      {sampleTemplateDraft && (
        <button
          type="button"
          className={`${UI.btnSecondary} h-9 px-3 text-xs`}
          onClick={() => handleTemplatePatch(sampleTemplateDraft)}
        >
          Load example data
        </button>
      )}
    </div>
  ) : (
    <div className="p-6 text-sm text-neutral-600 space-y-3">
      <p>Templates for this notice type are not yet available.</p>
    </div>
  );

  const previewNode = useMemo(() => {
    if (state.uploadMethod === 'template') {
      return <TemplatePreview text={templateText ?? ''} />;
    }
    return (
      <div className="p-6 text-sm text-neutral-600" data-testid="preview-placeholder">
        Preview will appear here once the notice is built.
      </div>
    );
  }, [state.uploadMethod, templateText]);

  return (
    <div className="space-y-6" data-testid="publish-next-flow">
      <div className="grid gap-8 md:grid-cols-3">
        <main className="md:col-span-2 space-y-6">
          <ProgressBar step={step} totalSteps={4} labels={labels} />
          {step === 1 && (
            <NoticeTypeStep
              selectedId={state.definitionId}
              onSelect={handleSelectDefinition}
              onContinue={handleContinueFromStep1}
            />
          )}
          {step === 2 && selectedDefinition && (
            <UploadMethodStep
              definition={selectedDefinition}
              method={state.uploadMethod}
              onMethodChange={handleUploadMethodChange}
              onBack={handleBackToStep1}
              onContinue={handleContinueFromStep2}
              continueDisabled={
                state.uploadMethod === 'template'
                  ? !(templateParse && templateParse.success)
                  : !state.uploadMethod
              }
              fromNoticeContent={fromNoticePlaceholder}
              templateContent={templateFormContent}
            />
          )}
          {step === 3 && selectedDefinition && state.uploadMethod && (
            <ConfirmStep
              definition={selectedDefinition}
              notice={computedNotice}
              uploadMethod={state.uploadMethod}
              onBack={handleBackToStep2}
              onContinue={handleContinueToPayment}
              continueDisabled={!computedNotice}
              preview={previewNode}
              metadata={confirmMetadata}
            />
          )}
          {step === 4 && selectedDefinition && (
            <PaymentStep
              definition={selectedDefinition}
              notice={computedNotice}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
            />
          )}
        </main>
        <aside className="space-y-4">
          <div className={`${UI.card} p-5 space-y-3`} data-testid="selection-summary">
            <h3 className="text-sm font-semibold text-neutral-800">Selection summary</h3>
            <dl className="space-y-2 text-sm text-neutral-600">
              <div>
                <dt className="font-medium text-neutral-700">Notice type</dt>
                <dd className="mt-0.5 text-neutral-600">
                  {selectedDefinition ? selectedDefinition.label : 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-700">Upload method</dt>
                <dd className="mt-0.5 text-neutral-600">
                  {state.uploadMethod === 'notice'
                    ? 'Upload from notice'
                    : state.uploadMethod === 'template'
                      ? 'Upload via template'
                      : 'Not selected'}
                </dd>
              </div>
              {computedNotice?.consultation?.repsDeadline && (
                <div>
                  <dt className="font-medium text-neutral-700">Representations deadline</dt>
                  <dd className="mt-0.5 text-neutral-600">{computedNotice.consultation.repsDeadline}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/90 p-5 text-sm text-neutral-600">
            <p>
              All new functionality is behind the <code className="rounded bg-neutral-100 px-1">NEW_PUBLISH_FLOW</code> flag. Disable it to return to the existing Licensing Act 2003 path.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
