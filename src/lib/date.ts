export const BANK_HOLIDAYS: Record<string, string[]> = {
  england_wales: ['2024-01-01','2024-04-01','2024-05-06','2024-05-27','2024-08-26','2024-12-25','2024-12-26'],
  scotland: ['2024-01-01','2024-01-02','2024-04-01','2024-05-06','2024-08-05','2024-12-02','2024-12-25','2024-12-26'],
};

function parseISODateUTC(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function formatUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekendUTC(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function isHolidayUTC(d: Date, region: string): boolean {
  const list = BANK_HOLIDAYS[region] || [];
  const iso = formatUTC(d);
  return list.includes(iso);
}

export function calcRepDeadline(applicationDate: string, region: string = 'england_wales'): string {
  const d = parseISODateUTC(applicationDate);
  d.setUTCDate(d.getUTCDate() + 28);
  while (isWeekendUTC(d) || isHolidayUTC(d, region)) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return formatUTC(d);
}
