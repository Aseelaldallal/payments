import { calendarDaysBetween, isValidIsoDate } from '../../src/shared/iso-date';

describe('ISO date', () => {
  it('accepts a real date in YYYY-MM-DD format', () => {
    expect(isValidIsoDate('2026-09-08')).toBe(true);
  });

  it('rejects an impossible calendar date', () => {
    expect(isValidIsoDate('2026-02-31')).toBe(false);
  });

  it('rejects a timestamp', () => {
    expect(isValidIsoDate('2026-09-08T00:00:00Z')).toBe(false);
  });

  it('counts calendar days between dates', () => {
    expect(calendarDaysBetween('2026-09-08', '2026-11-07')).toBe(60);
  });
});
