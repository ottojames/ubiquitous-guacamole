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
import NoticePreview, { type PreviewIssue } from './NoticePreview';

const labels = ['Confirm notice type', 'Upload your notice', 'Confirm your notice', 'Pay'];

type Step = 1 | 2 | 3 | 4;

type TemplateDraft = Record<string, unknown> | null;

export default function NewPublishFlow() {
  const [step, setStep] = useState<Step>(1);
  const [definitionId, setDefinitionId] = useState<string | null>(null);
  const definition = useMemo<NoticeDefinition | null>(
    () => (definitionId ? getDefinitionById(definitionId) ?? null : null),
    [definitionId]
  );
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(null);

  useEffect(() => {
    if (!definition) {
      setUploadMethod(null);
      setTemplateDraft(null);
      if (step > 1) {
        setStep(1);
      }
    }
  }, [definition, step]);

  const handleSelectDefinition = React.useCallback((id: string, _definition: NoticeDefinition) => {
    setDefinitionId(id);
    setUploadMethod(null);
    setTemplateDraft({});
  }, []);

  const handleContinueFromStep1 = React.useCallback(() => {
    if (!definitionId) return;
    setStep(2);
  }, [definitionId]);

  const handleMethodChange = React.useCallback((method: UploadMethod) => {
    setUploadMethod(method);
    if (method === 'template') {
      setTemplateDraft((prev) => prev ?? {});
    }
  }, []);

  const handleBackToStep1 = React.useCallback(() => {
    setStep(1);
  }, []);

  const handleContinueFromStep2 = React.useCallback(() => {
    if (!uploadMethod) return;
    setStep(3);
  }, [uploadMethod]);

  const handleBackToStep2 = React.useCallback(() => {
    setStep(2);
  }, []);

  const handleContinueToPayment = React.useCallback(() => {
    setStep(4);
  }, []);

  const builder = useMemo(() => {
    if (!definition) return null;
    return getNoticeBuilder(definition.id);
  }, [definition?.id]);

  const templateRenderer = useMemo(() => {
    if (!definition) return null;
    return getNoticeTemplateRenderer(definition.templateKey);
  }, [definition?.templateKey]);

  const handleTemplatePatch = React.useCallback((patch: Record<string, unknown>) => {
    setTemplateDraft((prev) => ({ ...(prev ?? {}), ...patch }));
  }, []);

  const updateTemplateDraftPath = React.useCallback((path: (string | number)[], value: unknown) => {
    setTemplateDraft((prev) => setNested(prev ?? {}, path, value));
  }, []);

  const templatePayload = useMemo(() => {
    if (!builder || uploadMethod !== 'template') return null;
    return {
      ...(templateDraft ?? {}),
      variant: definition?.id,
    };
  }, [builder, uploadMethod, templateDraft, definition?.id]);

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

  const issues = useMemo<PreviewIssue[]>(() => {
    if (uploadMethod !== 'template') return [];
    const parseIssues = parseMessages.map<PreviewIssue>((message) => ({ type: 'parse', message }));
    const windowRuleIssues = validationIssues.map<PreviewIssue>((issue) => ({ type: 'window', message: issue.message }));
    return [...parseIssues, ...windowRuleIssues];
  }, [uploadMethod, parseMessages, validationIssues]);

  const confirmMetadata = useMemo(() => {
    if (uploadMethod !== 'template') return null;
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
  }, [uploadMethod, parseMessages, validationIssues]);

  const computedNotice: NoticeBase | null = uploadMethod === 'template' ? templateNotice : null;

  const handleSubmit = React.useCallback(() => {
    // Placeholder for integration with payment/submit endpoint
    console.info('Submit notice', computedNotice);
  }, [computedNotice]);

  const sampleTemplateDraft = useMemo(() => {
    if (!definition) return null;
    return buildSampleDraft(definition.id);
  }, [definition?.id]);

  const fromNoticePlaceholder = (
    <div className="p-6 text-sm text-neutral-600 space-y-3">
      <p>
        Upload capture coming soon. Drop a PDF, DOCX, or image to run OCR and auto-fill your notice.
      </p>
      <p>
        The new flow will use structured parsing, red required placeholders, and unified address lookup.
      </p>
      <p>
        You can still continue with manual entry today by selecting the template builder option.
      </p>
    </div>
  );

  const templateFormContent = builder ? (
    <div className="space-y-4 p-6">
      <TemplateBuilderForm definition={definition!} draft={templateDraft} onChange={updateTemplateDraftPath} />
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
    if (uploadMethod === 'template') {
      return <TemplatePreview text={templateText ?? ''} />;
    }
    return (
      <div className="p-6 text-sm text-neutral-600" data-testid="preview-placeholder">
        Preview will appear here once the notice is built.
      </div>
    );
  }, [uploadMethod, templateText]);

  return (
    <div className="space-y-6" data-testid="publish-next-flow">
      <div className="grid gap-8 md:grid-cols-3">
        <main className="md:col-span-2 space-y-6">
          <ProgressBar step={step} totalSteps={4} labels={labels} />
          {step === 1 && (
            <NoticeTypeStep
              selectedId={definitionId}
              onSelect={handleSelectDefinition}
              onContinue={handleContinueFromStep1}
            />
          )}
          {step === 2 && definition && (
            <UploadMethodStep
              definition={definition}
              method={uploadMethod}
              onMethodChange={handleMethodChange}
              onBack={handleBackToStep1}
              onContinue={handleContinueFromStep2}
              continueDisabled={!uploadMethod}
              fromNoticeContent={fromNoticePlaceholder}
              templateContent={templateFormContent}
              rightRail={
                <NoticePreview
                  definition={definition}
                  draft={templateDraft}
                  issues={issues}
                />
              }
            />
          )}
          {step === 3 && definition && uploadMethod && (
            <ConfirmStep
              definition={definition}
              notice={computedNotice}
              uploadMethod={uploadMethod}
              onBack={handleBackToStep2}
              onContinue={handleContinueToPayment}
              continueDisabled={uploadMethod === 'template' && !computedNotice}
              preview={previewNode}
              metadata={confirmMetadata}
            />
          )}
          {step === 4 && definition && (
            <PaymentStep
              definition={definition}
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
                <dd className="mt-0.5 text-neutral-600">{definition ? definition.label : 'Not selected'}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-700">Upload method</dt>
                <dd className="mt-0.5 text-neutral-600">
                  {uploadMethod === 'notice'
                    ? 'Upload from notice'
                    : uploadMethod === 'template'
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
              All new functionality is behind the <code className="rounded bg-neutral-100 px-1">NEW_PUBLISH_FLOW</code> flag. Disable it
              to return to the existing Licensing Act 2003 path.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
