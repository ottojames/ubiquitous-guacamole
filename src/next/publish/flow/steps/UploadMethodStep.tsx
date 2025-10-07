import React from 'react';
import * as UI from '@/styles/ui';
import type { NoticeDefinition } from '@/next/publish/config/noticeTypes';

export type UploadMethod = 'notice' | 'template';

export type UploadMethodStepProps = {
  definition: NoticeDefinition;
  method: UploadMethod | null;
  onMethodChange: (method: UploadMethod) => void;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  fromNoticeContent: React.ReactNode;
  templateContent: React.ReactNode;
};

const tabs: Array<{ key: UploadMethod; label: string; description: string }> = [
  { key: 'notice', label: 'Upload from Notice', description: 'Drop your signed notice or supply text for OCR.' },
  { key: 'template', label: 'Upload via Template', description: 'Generate the notice using our structured form.' },
];

export default function UploadMethodStep({
  definition,
  method,
  onMethodChange,
  onBack,
  onContinue,
  continueDisabled,
  fromNoticeContent,
  templateContent,
}: UploadMethodStepProps) {
  return (
    <section className={`${UI.card} p-6 space-y-6`} data-testid="upload-method-step">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">Step 2 · Upload your notice</p>
        <h2 className="text-base font-semibold text-brand-navy">{definition.label}</h2>
        <p className="text-sm text-neutral-600">
          Choose how you want to prepare this notice. You can upload an existing draft for OCR or build it via our template.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Upload method">
        {tabs.map((tab) => {
          const isActive = method === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${UI.btnSecondary} h-10 px-4 text-sm transition-colors duration-200 focus:ring-offset-0 focus:ring-offset-transparent ${
                isActive
                  ? 'bg-white text-brand-navy font-semibold shadow-sm border-brand-blue/50'
                  : 'bg-white/80 text-brand-navy/70 border-white/70 hover:bg-white'
              }`}
              data-testid={`upload-method-${tab.key}`}
              onClick={() => onMethodChange(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white/80">
        {method === 'notice' && <div role="tabpanel">{fromNoticeContent}</div>}
        {method === 'template' && <div role="tabpanel">{templateContent}</div>}
        {!method && (
          <div className="p-10 text-center text-sm text-neutral-500" data-testid="upload-method-placeholder">
            Select an option above to continue.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-2">
        <button type="button" className={UI.btnSecondary} onClick={onBack} data-testid="upload-method-back">
          Back
        </button>
        <button
          type="button"
          className={`${UI.btnPrimary} min-w-[150px]`}
          onClick={onContinue}
          disabled={continueDisabled ?? !method}
          data-testid="upload-method-continue"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
