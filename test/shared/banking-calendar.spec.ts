import {
  addBankingDays,
  bankingDaysBetween,
  isBankingDay,
} from '../../src/shared/banking-calendar';

describe('banking calendar', () => {
  it('skips weekends', () => {
    expect(addBankingDays('2026-09-11', 1)).toBe('2026-09-14');
  });

  it('skips Fed holidays', () => {
    expect(isBankingDay('2026-11-26')).toBe(false);
    expect(addBankingDays('2026-11-25', 2)).toBe('2026-11-30');
  });

  it('counts banking days between dates', () => {
    expect(bankingDaysBetween('2026-09-08', '2026-09-10')).toBe(2);
    expect(bankingDaysBetween('2026-09-08', '2026-09-15')).toBe(5);
  });
});
