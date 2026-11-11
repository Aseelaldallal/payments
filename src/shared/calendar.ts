/**
 * Banking-day calendar.
 *
 * A banking day is a weekday that is not a Federal Reserve holiday.
 * Dates are plain ISO strings, "YYYY-MM-DD", no time, no zone.
 * The hidden tests and your code share this file so that both count
 * days the same way.
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

export function parseDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isBankingDay(iso: string): boolean {
  const d = parseDate(iso);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !HOLIDAYS.has(iso);
}

export function addCalendarDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
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
  if (parseDate(to) < parseDate(from)) return -bankingDaysBetween(to, from);
  let count = 0;
  let cur = from;
  while (cur !== to) {
    cur = addCalendarDays(cur, 1);
    if (isBankingDay(cur)) count += 1;
  }
  return count;
}

/** Calendar days from `from` to `to`, negative if `to` is earlier. */
export function calendarDaysBetween(from: string, to: string): number {
  const ms = parseDate(to).getTime() - parseDate(from).getTime();
  return Math.round(ms / 86_400_000);
}
