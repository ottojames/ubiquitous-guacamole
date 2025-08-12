export interface Hours {
  [day: string]: { start: string; end: string };
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function formatHours(hours: Hours): string {
  const result: string[] = [];
  let i = 0;
  while (i < days.length) {
    const day = days[i];
    const h = hours[day];
    if (!h?.start || !h?.end) {
      i++;
      continue;
    }
    const start = h.start;
    const end = h.end;
    let j = i + 1;
    while (
      j < days.length &&
      hours[days[j]]?.start === start &&
      hours[days[j]]?.end === end
    ) {
      j++;
    }
    const label = i + 1 === j ? days[i] : `${days[i]}–${days[j - 1]}`;
    result.push(`${label}: ${start}–${end}`);
    i = j;
  }
  return result.join('\n');
}

function extractAddressAndPostcode(address: string): { address: string; postcode: string } {
  const match = address.match(/(.*)\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})$/i);
  if (match) {
    return {
      address: match[1].trim().replace(/,?$/, ''),
      postcode: match[2].toUpperCase(),
    };
  }
  return { address, postcode: '' };
}

function summarizeOpeningHours(hours: Hours): { days: string; start: string; end: string } {
  const first = hours['Mon'];
  if (!first?.start || !first?.end) return { days: '', start: '', end: '' };
  const allSame = days.every((d) => hours[d]?.start === first.start && hours[d]?.end === first.end);
  if (allSame) {
    return { days: 'Monday to Sunday', start: first.start, end: first.end };
  }
  return { days: '', start: '', end: '' };
}

const template = `Notice of Application for a [APPLICATION_TYPE]

I, [APPLICANT FULL NAME] Address of Premises: [PREMISES NAME], [PREMISES ADDRESS], [POSTCODE] have made the above application on [APPLICATION DATE] to [COUNCIL NAME] for:
[LICENSABLE ACTIVITIES AND DESCRIPTION] and opening hours [DAYS] [START TIME] to [END TIME].
The full application can be viewed at [COUNCIL NAME]. Contact [LICENSING MANAGER / OFFICER], [COUNCIL DEPARTMENT / OFFICE NAME], [COUNCIL OFFICE ADDRESS], between the hours of [VIEWING START TIME] and [VIEWING END TIME] on [VIEWING DAYS], visit [COUNCIL WEBSITE], or email: [COUNCIL LICENSING EMAIL].
A Responsible Authority or Other Persons may make written representations about this application to the Licensing Office on or before [REPRESENTATION DEADLINE DATE].
It is an offence, knowingly or recklessly, to make a false statement in connection with an application, and on summary conviction is liable to an unlimited fine.`;

export function generateNotice(form: any): string {
  const { address, postcode } = extractAddressAndPostcode(form.premisesAddress || '');
  const activityBlock = (form.activities || [])
    .map((a: string) => `${a}\n${formatHours(form.activityHours?.[a] || {})}`)
    .join('\n\n');
  const opening = summarizeOpeningHours(form.openingHours || {});
  const replacements: Record<string, string> = {
    'APPLICATION_TYPE': form.applicationType || '',
    'APPLICANT FULL NAME': form.applicantName || '',
    'PREMISES NAME': form.premisesName || '',
    'PREMISES ADDRESS': address,
    'POSTCODE': postcode,
    'APPLICATION DATE': form.applicationDate || new Date().toLocaleDateString('en-GB'),
    'COUNCIL NAME': form.councilName || '',
    'LICENSABLE ACTIVITIES AND DESCRIPTION': activityBlock,
    'DAYS': opening.days,
    'START TIME': opening.start,
    'END TIME': opening.end,
    'LICENSING MANAGER / OFFICER': form.licensingManager || '',
    'COUNCIL DEPARTMENT / OFFICE NAME': form.councilDepartment || '',
    'COUNCIL OFFICE ADDRESS': form.councilOfficeAddress || '',
    'VIEWING START TIME': form.viewingStartTime || '',
    'VIEWING END TIME': form.viewingEndTime || '',
    'VIEWING DAYS': form.viewingDays || '',
    'COUNCIL WEBSITE': form.councilWebsite || '',
    'COUNCIL LICENSING EMAIL': form.councilLicensingEmail || form.councilEmail || '',
    'REPRESENTATION DEADLINE DATE': form.representationDeadline || '',
  };
  let text = template;
  for (const [key, value] of Object.entries(replacements)) {
    text = text.replaceAll(`[${key}]`, value);
  }
  return text;
}
