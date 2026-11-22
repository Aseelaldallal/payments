import { addCalendarDays, parseIsoDate } from '../../shared/iso-date';

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
  const date = parseIsoDate(iso);
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  return !HOLIDAYS.has(iso);
}

/** The n-th banking day after `iso` (n >= 1). n = 0 returns `iso` itself. */
export function addBankingDays(iso: string, count: number): string {
  let currentDate = iso;
  let remainingDays = count;
  while (remainingDays > 0) {
    currentDate = addCalendarDays(currentDate, 1);
    if (isBankingDay(currentDate)) remainingDays -= 1;
  }
  return currentDate;
}

/** Number of banking days strictly after `from` up to and including `to`. */
export function bankingDaysBetween(from: string, to: string): number {
  if (parseIsoDate(to) < parseIsoDate(from)) {
    return -bankingDaysBetween(to, from);
  }

  let count = 0;
  let currentDate = from;
  while (currentDate !== to) {
    currentDate = addCalendarDays(currentDate, 1);
    if (isBankingDay(currentDate)) count += 1;
  }
  return count;
}
