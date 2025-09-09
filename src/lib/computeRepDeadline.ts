// src/lib/computeRepDeadline.ts
import { addDays, endOfDay, formatISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * LA2003: “no later than 28 days after the day the application was given”.
 * Returns a UTC ISO string for 23:59:59.999 at Day 28 in Europe/London.
 */
export function computeRepDeadline(appDateISO: string): string {
  const zone = "Europe/London";
  const local = toZonedTime(new Date(appDateISO), zone);
  const day28 = addDays(local, 28);
  const eodLocal = endOfDay(day28);
  const asUtc = new Date(eodLocal.getTime() - eodLocal.getTimezoneOffset() * 60000);
  return formatISO(asUtc);
}