import Checklist, { type ChecklistItem } from '../ComplianceChecklist';

export default function ComplianceCard({ items, onFix }: { items: ChecklistItem[]; onFix?: (target?: string) => void }) {
  return <Checklist items={items} onFix={onFix} />;
}
