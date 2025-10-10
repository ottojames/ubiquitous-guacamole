import React, { useState, useMemo, useCallback, useEffect } from "react";
import * as UI from "@/styles/ui";
import ProgressBar from "@/components/publish/ProgressBar";
import NoticeTypeStep from "./steps/NoticeTypeStep";
import UploadMethodStep, { type UploadMethod } from "./steps/UploadMethodStep";
import TemplateBuilderForm from "./TemplateBuilderForm";
import TemplatePreview from "./TemplatePreview";
import ConfirmStep from "./steps/ConfirmStep";
import PaymentStep from "./steps/PaymentStep";
import UploadDropzone from "@/components/publish/UploadDropzone";
import NoticePreview from "@/components/publish/NoticePreview";
import { getDefinitionById } from "@/next/publish/config/noticeTypes";
import { getNoticeTemplateRenderer } from "@/next/publish/templates";
import { validateWindowRules } from "@/next/publish/validation/windowRules";

const labels = ["Confirm notice type", "Upload your notice", "Confirm your notice", "Pay"];

type Step = 1 | 2 | 3 | 4;

export default function NewPublishFlow() {
  const [step, setStep] = useState<Step>(1);
  const [definitionId, setDefinitionId] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [templateDraft, setTemplateDraft] = useState<Record<string, unknown>>({});
  const [issues, setIssues] = useState<{ message: string }[]>([]);

  const definition = useMemo(() => (definitionId ? getDefinitionById(definitionId) : null), [definitionId]);
  const renderer = useMemo(
    () => (definition ? getNoticeTemplateRenderer(definition) : null),
    [definition]
  );

  useEffect(() => {
    if (!definition) return;
    const result = validateWindowRules(definition);
    setIssues(result ?? []);
  }, [definition]);

  const next = useCallback(() => setStep((s) => Math.min(4, s + 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <ProgressBar step={step} labels={labels} />
      <div className="mt-8">
        {step === 1 && (
          <NoticeTypeStep
            selectedId={definitionId}
            onSelect={(id, def) => {
              setDefinitionId(id);
              setUploadMethod(null);
              setTemplateDraft({});
            }}
            onContinue={() => definitionId && next()}
          />
        )}

        {step === 2 && definition && (
          <UploadMethodStep
            definition={definition}
            method={uploadMethod}
            onMethodChange={setUploadMethod}
            onBack={back}
            onContinue={next}
            continueDisabled={!uploadMethod}
            fromNoticeContent={
              <UploadDropzone
                definition={definition}
                onUploadComplete={(draft) => {
                  setTemplateDraft(draft);
                  setUploadMethod("notice");
                }}
              />
            }
            templateContent={
              renderer && (
                <TemplateBuilderForm
                  definition={definition}
                  initialValues={templateDraft}
                  onChange={(data) => setTemplateDraft(data)}
                />
              )
            }
            rightRail={<NoticePreview definition={definition} draft={templateDraft} issues={issues} />}
          />
        )}

        {step === 3 && (
          <ConfirmStep
            definition={definition}
            draft={templateDraft}
            onBack={back}
            onContinue={next}
            rightRail={<NoticePreview definition={definition} draft={templateDraft} issues={issues} />}
          />
        )}

        {step === 4 && <PaymentStep definition={definition} draft={templateDraft} onBack={back} />}
      </div>
    </div>
  );
}
