import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import FileDropOCR from '@/components/upload/FileDropOCR';
import PreviewCard from '@/components/publish/RightRail/PreviewCard';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';

export default function UploadNoticeFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState('');

  return (
    <div>
      <ProgressBar step={step} />
      <div className="grid md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
          {step === 1 && <FileDropOCR onText={setText} />}
          {step === 2 && (
            <div>
              <p className="mb-4">Confirm your notice.</p>
              <button className="mr-2 rounded-md border px-4 py-2" onClick={() => setStep(1)}>Back</button>
              <button className="rounded-md border px-4 py-2" onClick={() => setStep(3)}>Continue to Pay</button>
            </div>
          )}
          {step === 3 && <div>Pay step.</div>}
          {step === 1 && (
            <div>
              <button
                className="rounded-md border px-4 py-2"
                disabled={!text}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          )}
        </main>
        <aside className="md:col-span-1 space-y-4">
          <PreviewCard text={text} />
          <ComplianceCard items={[]} />
          <KeyDatesCard applicationDate="" representationDeadline="" consultationDays={28} />
          <CostCard cost={0} canSubmit={false} />
        </aside>
      </div>
    </div>
  );
}
