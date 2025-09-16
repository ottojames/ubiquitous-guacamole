import { PremisesLicence } from '../schemas/noticeTypes/premises-licence.schema';
import { computeRepresentationDeadline } from '../schemas/rules/premises-licence.rules';
/* CN:STEP2-COMPLIANCE-UPGRADE-START */
import { formatDisplayDateTime } from '@/lib/format';
/* CN:STEP2-COMPLIANCE-UPGRADE-END */

export interface CouncilStyle {
  headingCase?: 'upper' | 'title';
  region: 'england_wales' | 'scotland' | 'northern_ireland';
  bankHolidays?: string[];
  extraLines?: string[];
}

function formatHeading(style: CouncilStyle): string {
  const base =
    style.region === 'scotland'
      ? 'Licensing (Scotland) Act 2005'
      : 'Licensing Act 2003';
  return style.headingCase === 'upper' ? base.toUpperCase() : base;
}

export function renderPremisesLicence(
  data: PremisesLicence,
  council: CouncilStyle
): string {
  const deadline = computeRepresentationDeadline(
    data.applicationDate,
    council.bankHolidays
  );
  const lines: string[] = [];
  const formatAddress = (a: { line1: string; city: string; postcode: string }) =>
    `${a.line1}, ${a.city} ${a.postcode}`;
  lines.push(formatHeading(council));
  lines.push(
    `An application has been made by ${data.applicant} of ${formatAddress(data.applicantAddress)} to ${data.council} for a Premises Licence at ${formatAddress(data.address)}.`
  );
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  const summary = (data as any)?.applicationSummary?.toString?.().trim?.() as string | undefined;
  if (summary) {
    lines.push(summary);
  } else {
    lines.push('The application proposes the following licensable activities and hours:');
    data.activities.forEach((a) => {
      const days = a.days.join(', ');
      lines.push(`- ${a.type.replace(/_/g, ' ')}: ${days} ${a.start}–${a.end}`);
    });
  }
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  const deadlineDate = new Date(`${deadline}T23:59:00`);
  const deadlineDisplay = `${formatDisplayDateTime(deadlineDate)} (24h)`;
  lines.push(
    `Any person may make representations on this application to arrive no later than ${deadlineDisplay}. Representations may be made via ${data.representation.method}: ${data.representation.value}.`
  );
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  lines.push(
    'It is an offence to knowingly or recklessly make a false statement in connection with an application. Those who do are liable on summary conviction to an unlimited fine.'
  );
  if (council.extraLines) lines.push(...council.extraLines);
  return lines.join('\n');
}
