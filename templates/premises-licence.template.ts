import { PremisesLicence } from '../schemas/noticeTypes/premises-licence.schema';
import { computeRepresentationDeadline } from '../schemas/rules/premises-licence.rules';

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
  lines.push(formatHeading(council));
  lines.push(
    `${data.applicant} has applied for a premises licence for ${data.premises}, ${data.address.line1}, ${data.address.city} ${data.address.postcode}.`
  );
  lines.push('Licensable activities and hours:');
  data.activities.forEach((a) => {
    const days = a.days.join(', ');
    lines.push(`- ${a.type.replace(/_/g, ' ')}: ${days} ${a.start}–${a.end}`);
  });
  lines.push(
    `Representations must be made by ${deadline} via ${data.representation.method}: ${data.representation.value}.`
  );
  lines.push(
    'It is an offence to knowingly or recklessly make a false statement in connection with an application. Those who do are liable on summary conviction to a fine of up to level 5 on the standard scale.'
  );
  if (council.extraLines) lines.push(...council.extraLines);
  return lines.join('\n');
}
