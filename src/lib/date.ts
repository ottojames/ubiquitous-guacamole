export const BANK_HOLIDAYS: Record<string, string[]> = {
  england_wales: ['2024-01-01','2024-04-01','2024-05-06','2024-05-27','2024-08-26','2024-12-25','2024-12-26'],
  scotland: ['2024-01-01','2024-01-02','2024-04-01','2024-05-06','2024-08-05','2024-12-02','2024-12-25','2024-12-26'],
};

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isHoliday(d: Date, region: string): boolean {
  const list = BANK_HOLIDAYS[region] || [];
  const iso = d.toISOString().slice(0,10);
  return list.includes(iso);
}

export function calcRepDeadline(applicationDate: string, region: string = 'england_wales'): string {
  const d = new Date(applicationDate + 'T00:00:00');
  d.setDate(d.getDate() + 28);
  while (isWeekend(d) || isHoliday(d, region)) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0,10);
}
