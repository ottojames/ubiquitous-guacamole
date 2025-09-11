import { PremisesLicence } from '../noticeTypes/premises-licence.schema';

function parseTime(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

export function computeRepresentationDeadline(
  applicationDate: string,
  bankHolidays: string[] = []
): string {
  const [y, m, d] = applicationDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const isHoliday = new Set(bankHolidays);

  // Statutory period: 28 clear days starting the day after application
  // i.e., add 1 day to start, then add 28 days => +29 from application date
  date.setUTCDate(date.getUTCDate() + 29);
  while (
    date.getUTCDay() === 0 ||
    date.getUTCDay() === 6 ||
    isHoliday.has(date.toISOString().slice(0, 10))
  ) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

export function validatePremisesLicence(
  data: PremisesLicence,
  bankHolidays: string[] = []
): { representationDeadline: string; issues: string[] } {
  const issues: string[] = [];

  if (!data.activities.length) {
    issues.push('At least one licensable activity is required');
  }

  data.activities.forEach((a, idx) => {
    const s = parseTime(a.start);
    const e = parseTime(a.end);
    if (s === e) {
      issues.push(`Activity ${idx + 1} has invalid hours`);
      return;
    }
    const duration = (e <= s ? e + 24 * 60 : e) - s;
    if (duration <= 0 || duration >= 24 * 60) {
      issues.push(`Activity ${idx + 1} has invalid hours`);
    }
  });

  const representationDeadline = computeRepresentationDeadline(
    data.applicationDate,
    bankHolidays
  );

  return { representationDeadline, issues };
}
