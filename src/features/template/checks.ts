import type { ChecklistItem } from '@/components/publish/ComplianceChecklist';
import { formatUKPostcode } from '@/lib/ukPostcode';
import type { TemplateNotice } from './types';
import { hasEnabledHours } from './noticeRenderer';

export function buildChecklist(notice: TemplateNotice): ChecklistItem[] {
  const trimmed = (value?: string | null) => value?.trim() ?? '';
  const postcode = notice.premisesAddress?.postcode
    ? formatUKPostcode(notice.premisesAddress.postcode)
    : '';
  const premisesAddressComplete =
    trimmed(notice.premisesAddress?.line1).length > 0 &&
    trimmed(notice.premisesAddress?.town).length > 0 &&
    postcode.length > 0;

  const items: ChecklistItem[] = [
    {
      id: 'applicant-legal-name',
      label: 'Applicant legal name present',
      ok: trimmed(notice.applicantLegalName).length >= 2,
      target: 'applicantLegalName',
    },
    {
      id: 'applicant-phone',
      label: 'Applicant phone provided',
      ok: trimmed(notice.contactPhone).length >= 7,
      target: 'contactPhone',
    },
    {
      id: 'premises-name',
      label: 'Premises or trading name provided',
      ok: !!trimmed(notice.premisesName) || !!trimmed(notice.tradingName),
      target: 'tradingName',
    },
    {
      id: 'premises-address',
      label: 'Premises address complete',
      ok: premisesAddressComplete,
      target: 'premisesAddress-line1',
    },
    {
      id: 'activities-hours',
      label: 'Activities and hours completed',
      ok: hasEnabledHours(notice.activities),
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
      ok: !!trimmed(notice.representationDeadline),
      target: 'representationDeadline',
    },
    {
      id: 'declaration',
      label: 'Declaration confirmed',
      ok: notice.declarationAccepted,
      target: 'confirm-notice',
    },
  ];

  return items;
}
