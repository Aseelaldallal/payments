const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a real calendar date in YYYY-MM-DD format as UTC. */
export function parseIsoDate(value: string): Date {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Not an ISO date: ${value}`);
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatIsoDate(date) !== value) {
    throw new Error(`Not a valid calendar date: ${value}`);
  }

  return date;
}

/** Formats a Date as a UTC YYYY-MM-DD string. */
export function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Returns whether a string is a real calendar date in YYYY-MM-DD format. */
export function isValidIsoDate(value: string): boolean {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

/** Calendar days from `from` to `to`, negative if `to` is earlier. */
export function calendarDaysBetween(from: string, to: string): number {
  const milliseconds = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(milliseconds / 86_400_000);
}
