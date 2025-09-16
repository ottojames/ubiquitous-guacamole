/* CN:OFFICER-FINAL-START */
const MONTH_LOOKUP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const normalizeMonthToken = (token: string) => token.trim().toLowerCase();

const monthIndex = (token: string) => {
  const normalized = normalizeMonthToken(token);
  if (normalized in MONTH_LOOKUP) return MONTH_LOOKUP[normalized];
  const short = normalized.slice(0, 3);
  if (short in MONTH_LOOKUP) return MONTH_LOOKUP[short];
  return -1;
};

const resolveYear = (value: number) => {
  if (value >= 100) return value;
  if (value >= 50) return 1900 + value;
  return 2000 + value;
};

const withTime = (date: Date, time?: string | null) => {
  if (!time) {
    date.setHours(23, 59, 0, 0);
    return date;
  }
  const [hh, mm] = time.split(':').map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) {
    date.setHours(23, 59, 0, 0);
    return date;
  }
  date.setHours(hh, mm, 0, 0);
  return date;
};

export function extractDeadlineFromOcr(ocr: string): Date | null {
  if (!ocr) return null;
  const sample = ocr.split(/\r?\n/).slice(0, 200).join('\n');

  const numericMatch = sample.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?:[, ]+(\d{1,2}:\d{2}))?\b/i);
  if (numericMatch) {
    const day = Number.parseInt(numericMatch[1] || '', 10);
    const month = Number.parseInt(numericMatch[2] || '', 10) - 1;
    const year = resolveYear(Number.parseInt(numericMatch[3] || '', 10));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year) && month >= 0 && month <= 11) {
      const dt = new Date(year, month, day);
      if (!Number.isNaN(dt.getTime())) {
        return withTime(dt, numericMatch[4]);
      }
    }
  }

  const textualRegex = new RegExp(
    String.raw`\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{2,4})(?:,?\s+(\d{1,2}:\d{2}))?\b`,
    'i'
  );
  const textualMatch = sample.match(textualRegex);
  if (textualMatch) {
    const day = Number.parseInt(textualMatch[1] || '', 10);
    const month = monthIndex(textualMatch[2] || '');
    const year = resolveYear(Number.parseInt(textualMatch[3] || '', 10));
    if (!Number.isNaN(day) && month >= 0 && month <= 11 && !Number.isNaN(year)) {
      const dt = new Date(year, month, day);
      if (!Number.isNaN(dt.getTime())) {
        return withTime(dt, textualMatch[4]);
      }
    }
  }

  return null;
}

/* CN:GUARDRAIL-FINAL-START */
export function normalizeUKPostcode(input: string): string {
  if (!input) return input;
  const s = input.replace(/\s+/g, '').toUpperCase();
  return s.length > 3 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s;
}
/* CN:GUARDRAIL-FINAL-END */
/* CN:OFFICER-FINAL-END */
