import type { ChecklistItem } from '@/components/publish/ComplianceChecklist';
import { formatUKPostcode } from '@/lib/ukPostcode';
import type { TemplateNotice } from './types';

export function buildChecklist(notice: TemplateNotice): ChecklistItem[] {
  const trimmed = (value?: string | null) => value?.trim() ?? '';
  const postcodeOk = notice.premisesAddress?.postcode ? formatUKPostcode(notice.premisesAddress.postcode) : '';
  const hasActivities = Object.values(notice.activities || {}).some((week: any) => {
    if (!week) return false;
    return Object.values(week).some((range: any) => range?.enabled);
  });
  const representationDate = trimmed(notice.representationDeadline);

  const items: ChecklistItem[] = [
    {
      id: 'applicant-name',
      label: 'Applicant legal name present',
      ok: trimmed(notice.applicantName).length >= 2,
      target: 'applicantName',
    },
    {
      id: 'premises-postcode',
      label: 'Premises postcode captured',
      ok: !!postcodeOk,
      target: 'premises-address-picker-postcode',
    },
    {
      id: 'activities-hours',
      label: 'Activities and hours completed',
      ok: hasActivities,
      target: 'activities-grid',
    },
    {
      id: 'council-contacts',
      label: 'Council contact details confirmed',
      ok: !!trimmed(notice.council?.repEmail) && !!trimmed(notice.council?.repPostal),
      target: 'council-email',
    },
    {
      id: 'representation-deadline',
      label: 'Representation deadline calculated',
      ok: representationDate.length > 0,
      target: 'representationDeadline',
    },
  ];

  return items;
}
