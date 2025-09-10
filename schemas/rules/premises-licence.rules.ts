import { PremisesLicence } from '../noticeTypes/premises-licence.schema';

function parseTime(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

export function computeRepresentationDeadline(
  applicationDate: string,
  bankHolidays: string[] = []
): string {
  const app = new Date(applicationDate);
  const start = new Date(app.getFullYear(), app.getMonth(), app.getDate() + 1);
  const deadline = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 28);
  const holidaySet = new Set(bankHolidays);
  while (
    deadline.getDay() === 0 ||
    deadline.getDay() === 6 ||
    holidaySet.has(deadline.toISOString().slice(0, 10))
  ) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline.toISOString().slice(0, 10);
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
