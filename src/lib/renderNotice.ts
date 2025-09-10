import type { PremisesData } from '@/schemas/premises';

const TITLE = {
  grant: 'LICENSING ACT 2003 – NOTICE OF APPLICATION FOR A PREMISES LICENCE',
  variation: 'LICENSING ACT 2003 – NOTICE OF APPLICATION FOR A VARIATION OF A PREMISES LICENCE',
  review: 'LICENSING ACT 2003 – NOTICE OF APPLICATION FOR A REVIEW OF A PREMISES LICENCE',
} as const;

function daysLabel(days: PremisesData['activities'][number]['days']): string {
  if (days === 'everyday') return 'Mon–Sun';
  if (days === 'mon_thu') return 'Mon–Thu';
  if (days === 'fri_sat') return 'Fri–Sat';
  if (days === 'sun') return 'Sun';
  return (days as string[]).join(', ');
}

function activityLabel(kind: PremisesData['activities'][number]['kind']): string {
  switch (kind) {
    case 'alcohol':
      return 'Supply of alcohol';
    case 'late_night_refreshment':
      return 'Late night refreshment';
    case 'recorded_music':
      return 'Recorded music';
    case 'live_music':
      return 'Live music';
    case 'films':
      return 'Films';
  }
}

function ddmmyyyy(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function joinAddress(a: { line1?: string; line2?: string; line3?: string; city?: string; postcode?: string }): string {
  return [a.line1, a.line2, a.line3, a.city, a.postcode].filter((x) => !!x && String(x).trim()).join(', ');
}

function deriveAlcoholMode(acts: PremisesData['activities']): 'On' | 'Off' | 'On & Off' | '' {
  const a = acts.filter((x) => x.kind === 'alcohol');
  if (!a.length) return '';
  const modes = new Set(a.map((x) => (x.alcoholOnOff === 'on' ? 'On' : x.alcoholOnOff === 'off' ? 'Off' : 'On & Off')));
  if (modes.size === 1) return Array.from(modes)[0] as any;
  return 'On & Off';
}

export function renderPremisesNotice(data: PremisesData & {
  councilName: string;
  officeAddress?: string;
  licensingUrl?: string;
  postalAddress?: string;
  repsEmail?: string;
  repsUrl?: string;
  region?: 'EW' | 'SC' | 'NI';
}): string {
  const region = data.region || 'EW';
  const title = TITLE[data.applicationType];
  const fullAddress = joinAddress(data.address);
  const intro =
    data.applicationType === 'grant'
      ? `Notice is hereby given that **${data.applicantName}** has applied to **${data.councilName}** for a **Premises Licence** for **${data.premisesTradingName}**, **${fullAddress}**.`
      : data.applicationType === 'variation'
      ? `Notice is hereby given that **${data.applicantName}** has applied to **${data.councilName}** to vary the Premises Licence for **${data.premisesTradingName}**, **${fullAddress}**.`
      : `Notice is hereby given that **${data.applicantName}** has applied to **${data.councilName}** for a **Review of a Premises Licence** at **${data.premisesTradingName}**, **${fullAddress}**.`;

  const variation =
    data.applicationType === 'variation' && data.variationSummary?.trim()
      ? `The variation sought is to: **${data.variationSummary.trim()}**.`
      : '';

  const acts = data.activities
    .map((a) => `• ${activityLabel(a.kind)}: ${a.start}–${a.end} (${daysLabel(a.days)})`)
    .join('\n');

  const alcoholMode = deriveAlcoholMode(data.activities);
  const alcoholLine = alcoholMode ? `Alcohol sales: **${alcoholMode}**.` : '';

  const appDate = ddmmyyyy(data.applicationDate);
  const deadline = ddmmyyyy(data.representationDeadline);

  const inspect = data.councilName && (data.officeAddress || data.licensingUrl)
    ? (region === 'SC'
        ? `The application may be inspected at **${data.councilName}** (${data.officeAddress || ''}) during normal office hours or online at **${data.licensingUrl || ''}**.`
        : `The application and full details can be inspected at **${data.councilName}**, **${data.officeAddress || ''}** during normal office hours or online at **${data.licensingUrl || ''}**.`)
    : '';

  const reps = `Any person may make representations to **${data.councilName}** by **${deadline}**. Email: **${data.repsEmail || data.councilEmail || ''}** · Post: **${data.postalAddress || ''}**.`;

  const offence = region === 'SC'
    ? 'Any person who knowingly or recklessly makes a false statement in connection with an application is liable on summary conviction to a fine.'
    : region === 'NI'
    ? 'It is an offence to make, in any application, a statement which you know to be false in a material particular, or recklessly make such a statement.'
    : 'It is an offence to knowingly or recklessly make a false statement in connection with an application and a person may be liable on summary conviction to an unlimited fine.';

  const sections = [
    title,
    '',
    intro,
    variation,
    '',
    'Proposed licensable activities and hours:',
    acts,
    '',
    alcoholLine,
    '',
    `Application date: **${appDate}**.`,
    `Representations must be received by **${deadline}**.`,
    '',
    inspect,
    reps,
    '',
    offence,
  ].filter(Boolean);

  return sections.join('\n');
}
