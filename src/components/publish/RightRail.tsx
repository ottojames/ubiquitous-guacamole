import React from 'react';
import PreviewCard from './RightRail/PreviewCard';
import ComplianceCard from './RightRail/ComplianceCard';
import KeyDatesCard from './RightRail/KeyDatesCard';
import CostCard from './RightRail/CostCard';
import type { ErrorItem } from './ErrorSummary';

export type RightRailProps = {
  preview: string;
  issues: ErrorItem[];
  representationDeadline: string;
  consultationDays: number;
  cost?: number;
};

export default function RightRail({ preview, issues, representationDeadline, consultationDays, cost = 49.99 }: RightRailProps) {
  return (
    <div className="space-y-4 md:sticky md:top-24">
      <PreviewCard text={preview} />
      <ComplianceCard issues={issues} />
      <KeyDatesCard representationDeadline={representationDeadline} consultationDays={consultationDays} />
      <CostCard cost={cost} />
    </div>
  );
}
