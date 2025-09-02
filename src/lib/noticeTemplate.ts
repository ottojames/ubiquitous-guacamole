export interface Hours {
  [day: string]: { start: string; end: string };
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const template = `Licensing Act 2003
Notice of Application for the 
{{HEADING_LINE_3}}

{{APPLICANT_NAME}} gives notice that an application was made to {{COUNCIL_NAME}} for the {{HEADING_LINE_3}} at {{PREMISES_ADDRESS_FULL}} in which the following licensable activities are proposed…
{{ACTIVITIES_BLOCK}}

The full application, giving details about the proposed licensable activities, has been sent to the Licensing Section, {{COUNCIL_NAME}} and may be inspected, free of charge, at the offices of the council at:
{{COUNCIL_POSTAL_ADDRESS}}
between the hours of {{COUNCIL_OFFICE_HOURS}} (or by prior appointment)
Monday to Friday or
{{COUNCIL_APPLICATIONS_URL}}

An interested party or Responsible Authority may make representations to the Licensing Section within 28 Consecutive Days of the day the application was made as detailed above, no later than: {{REPRESENTATION_DEADLINE}}

It is an offence to knowingly or recklessly make a false statement in connection with an application and a person may be liable on summary conviction to an unlimited fine.`;

function ensure(value: string, field: string): string {
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function validateTime(value: string, allow24 = false): string {
  const regex = allow24
    ? /^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/
    : /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!regex.test(value)) throw new Error(`Invalid time: ${value}`);
  return value;
}

function groupHours(hours: Hours) {
  const groups: { start: string; end: string; days: string[] }[] = [];
  let i = 0;
  while (i < days.length) {
    const day = days[i];
    const h = hours[day];
    if (!h?.start || !h?.end) {
      i++;
      continue;
    }
    const start = validateTime(h.start);
    const end = validateTime(h.end, true);
    let j = i + 1;
    while (
      j < days.length &&
      hours[days[j]]?.start === start &&
      hours[days[j]]?.end === end
    ) {
      j++;
    }
    groups.push({ start, end, days: days.slice(i, j) });
    i = j;
  }
  return groups;
}

function dayLabel(groupDays: string[]): string {
  if (groupDays.length === 7) return 'DAILY';
  if (groupDays.length === 1) return groupDays[0];
  return `${groupDays[0]}\u2013${groupDays[groupDays.length - 1]}`;
}

function formatActivities(activities: string[], activityHours: Record<string, Hours>): string {
  if (!activities || activities.length === 0) {
    throw new Error('ACTIVITIES_BLOCK is required');
  }
  const lines: string[] = [];
  for (const act of activities) {
    const hours = activityHours[act];
    if (!hours) throw new Error(`Hours required for activity: ${act}`);
    const groups = groupHours(hours);
    for (const g of groups) {
      const dLabel = dayLabel(g.days);
      const hLabel = `${g.start} to ${g.end}`;
      lines.push(`${act} \u2013 ${hLabel}hrs - ${dLabel}`);
    }
  }
  if (lines.length === 0) throw new Error('ACTIVITIES_BLOCK is required');
  return lines.join('\n');
}

interface FormInput {
  applicationType?: string;
  applicantName?: string;
  councilName?: string;
  premisesName?: string;
  premisesAddress?: string;
  councilPostalAddress?: string;
  councilOfficeHours?: string;
  councilApplicationsUrl?: string;
  representationDeadline?: string;
  activities?: string[];
  activityHours?: Record<string, Hours>;
}

export function generateNotice(form: FormInput): string {
  const heading = ensure(form.applicationType || '', 'HEADING_LINE_3');
  const applicant = ensure(form.applicantName || '', 'APPLICANT_NAME');
  const council = ensure(form.councilName || '', 'COUNCIL_NAME');

  const address = ensure(form.premisesAddress || '', 'PREMISES_ADDRESS_FULL');
  if (!/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i.test(address)) {
    throw new Error('PREMISES_ADDRESS_FULL must include postcode');
  }
  const premisesAddressFull = form.premisesName
    ? `${form.premisesName}, ${address}`
    : address;

  const activities = formatActivities(form.activities || [], form.activityHours || {});

  const councilPostal = ensure(form.councilPostalAddress || '', 'COUNCIL_POSTAL_ADDRESS');
  const officeHours = ensure(form.councilOfficeHours || '', 'COUNCIL_OFFICE_HOURS');
  const applicationsUrl = ensure(form.councilApplicationsUrl || '', 'COUNCIL_APPLICATIONS_URL');
  const repDeadline = ensure(form.representationDeadline || '', 'REPRESENTATION_DEADLINE');

  const replacements: Record<string, string> = {
    HEADING_LINE_3: heading,
    APPLICANT_NAME: applicant,
    COUNCIL_NAME: council,
    PREMISES_ADDRESS_FULL: premisesAddressFull,
    ACTIVITIES_BLOCK: activities,
    COUNCIL_POSTAL_ADDRESS: councilPostal,
    COUNCIL_OFFICE_HOURS: officeHours,
    COUNCIL_APPLICATIONS_URL: applicationsUrl,
    REPRESENTATION_DEADLINE: repDeadline,
  };

  let text = template;
  for (const [key, value] of Object.entries(replacements)) {
    text = text.replace(`{{${key}}}`, value);
  }
  return text;
}
