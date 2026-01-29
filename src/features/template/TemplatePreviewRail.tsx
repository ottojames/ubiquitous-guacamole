import React from 'react';
import * as UI from '@/styles/ui';
import NoticePreview from '@/components/publish/NoticePreview';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import { buildChecklist } from './checks';
import { buildNoticeText } from './noticeRenderer';
import { useTemplateNotice, useTemplateStep } from './TemplateBuilderProvider';

export default function TemplatePreviewRail() {
  const notice = useTemplateNotice();
  const [step] = useTemplateStep();

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className={`${UI.card} p-4 md:p-5`}>
          <h3 className="text-sm font-semibold text-blue-900">Preview</h3>
          <p className="mt-1 text-sm text-slate-600">Preview appears after you complete Step 2.</p>
        </div>
        <div className={`${UI.card} p-4 md:p-5`}>
          <h3 className="text-sm font-semibold text-blue-900">Compliance checklist</h3>
          <p className="mt-1 text-sm text-slate-600">We will run checks once you enter details.</p>
        </div>
        <div className={`${UI.card} p-4 md:p-5`}>
          <h3 className="text-sm font-semibold text-blue-900">Key dates</h3>
          <p className="mt-1 text-sm text-slate-600">Dates will be calculated from your publication date.</p>
        </div>
      </div>
    );
  }

  const preview = buildNoticeText(notice);
  const checklist = buildChecklist(notice);

  return (
    <div className="space-y-4 md:space-y-5">
      <NoticePreview text={preview} />
      <ComplianceCard items={checklist} />
      <KeyDatesCard
        applicationDate={notice.intendedPublicationDate}
        representationDeadline={notice.representationDeadline}
        consultationDays={28}
      />
      <CostCard cost={50} canSubmit={step >= 3} label={step >= 4 ? 'Processing…' : undefined} />
    </div>
  );
}
