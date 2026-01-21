import React from 'react';
import PreviewCard from './RightRail/PreviewCard';
import ComplianceCard from './RightRail/ComplianceCard';
import KeyDatesCard from './RightRail/KeyDatesCard';
import CostCard from './RightRail/CostCard';
import type { ChecklistItem } from './ComplianceChecklist';

export type RightRailProps = {
  preview: string;
  issues: ChecklistItem[];
  applicationDate?: string;
  representationDeadline: string;
  consultationDays: number;
  canContinue?: boolean;
  step?: number;
  cost?: number;
};

export default function RightRail({
  preview,
  issues,
  applicationDate,
  representationDeadline,
  consultationDays,
  canContinue,
  step = 1,
  cost = 50,
}: RightRailProps) {
  return (
    <div className="space-y-4 md:sticky md:top-24">
      <PreviewCard text={preview} />
      <ComplianceCard items={issues} />
      <KeyDatesCard
        applicationDate={applicationDate ?? ''}
        representationDeadline={representationDeadline}
        consultationDays={consultationDays}
      />
      <CostCard
        cost={cost}
        canSubmit={Boolean(canContinue) && step === 3}
        label={step === 3 ? 'Submit' : undefined}
      />
    </div>
  );
}
