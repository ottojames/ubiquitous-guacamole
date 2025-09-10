import React from 'react';
import PreviewCard from './RightRail/PreviewCard';
import ComplianceCard from './RightRail/ComplianceCard';
import KeyDatesCard from './RightRail/KeyDatesCard';
import CostCard from './RightRail/CostCard';

export type RightRailProps = {
  preview: string;
  issues: string[];
  representationDeadline: string;
  cost?: number;
};

export default function RightRail({ preview, issues, representationDeadline, cost = 49.99 }: RightRailProps) {
  return (
    <div className="space-y-4 md:sticky md:top-24">
      <PreviewCard text={preview} />
      <ComplianceCard issues={issues} />
      <KeyDatesCard representationDeadline={representationDeadline} />
      <CostCard cost={cost} />
    </div>
  );
}
