import { addCalendarDays, parseIsoDate } from './iso-date';

/**
 * Banking-day calendar.
 *
 * A banking day is a weekday that is not a Federal Reserve holiday.
 * Dates are plain ISO strings, "YYYY-MM-DD", no time, no zone.
 */

/** Federal Reserve Bank holidays, observed dates. */
const HOLIDAYS = new Set<string>([
  // 2026
  '2026-01-01',
  '2026-01-19',
  '2026-02-16',
  '2026-05-25',
  '2026-06-19',
  '2026-07-03',
  '2026-09-07',
  '2026-10-12',
  '2026-11-11',
  '2026-11-26',
  '2026-12-25',
  // 2027
  '2027-01-01',
  '2027-01-18',
  '2027-02-15',
  '2027-05-31',
  '2027-06-18',
  '2027-07-05',
  '2027-09-06',
  '2027-10-11',
  '2027-11-11',
  '2027-11-25',
  '2027-12-24',
]);

export function isBankingDay(iso: string): boolean {
  const d = parseIsoDate(iso);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !HOLIDAYS.has(iso);
}

/** The n-th banking day after `iso` (n >= 1). n = 0 returns `iso` itself. */
export function addBankingDays(iso: string, n: number): string {
  let cur = iso;
  let left = n;
  while (left > 0) {
    cur = addCalendarDays(cur, 1);
    if (isBankingDay(cur)) left -= 1;
  }
  return cur;
}

/** Number of banking days strictly after `from` up to and including `to`. */
export function bankingDaysBetween(from: string, to: string): number {
  if (parseIsoDate(to) < parseIsoDate(from)) return -bankingDaysBetween(to, from);
  let count = 0;
  let cur = from;
  while (cur !== to) {
    cur = addCalendarDays(cur, 1);
    if (isBankingDay(cur)) count += 1;
  }
  return count;
}
