import Checklist, { type ChecklistItem } from '../ComplianceChecklist';

export default function ComplianceCard({ items }: { items: ChecklistItem[] }) {
  return <Checklist items={items} />;
}
