import { describe, it, expect } from 'vitest';
import { getBudgetMonth, currentBudgetMonth } from '../src/utils/date.js';

describe('KSA December Salary & Expense Cycle', () => {
  const SALARY_DAY = 28;

  it('correctly maps late November salary (Nov 28) to December budget', () => {
    const salaryDate = '2026-11-28';
    expect(getBudgetMonth(salaryDate, SALARY_DAY)).toBe('2026-12');
  });

  it('correctly maps expenses on Nov 28, 29, 30 to December budget', () => {
    expect(getBudgetMonth('2026-11-28', SALARY_DAY)).toBe('2026-12');
    expect(getBudgetMonth('2026-11-29', SALARY_DAY)).toBe('2026-12');
    expect(getBudgetMonth('2026-11-30', SALARY_DAY)).toBe('2026-12');
  });

  it('keeps pre-salary November expenses (Nov 1 - Nov 27) in November budget', () => {
    expect(getBudgetMonth('2026-11-01', SALARY_DAY)).toBe('2026-11');
    expect(getBudgetMonth('2026-11-15', SALARY_DAY)).toBe('2026-11');
    expect(getBudgetMonth('2026-11-27', SALARY_DAY)).toBe('2026-11');
  });

  it('keeps expenses throughout December up to Dec 27 in December budget', () => {
    expect(getBudgetMonth('2026-12-01', SALARY_DAY)).toBe('2026-12');
    expect(getBudgetMonth('2026-12-10', SALARY_DAY)).toBe('2026-12');
    expect(getBudgetMonth('2026-12-25', SALARY_DAY)).toBe('2026-12');
    expect(getBudgetMonth('2026-12-27', SALARY_DAY)).toBe('2026-12');
  });

  it('switches to January budget starting Dec 28', () => {
    expect(getBudgetMonth('2026-12-28', SALARY_DAY)).toBe('2027-01');
    expect(getBudgetMonth('2026-12-31', SALARY_DAY)).toBe('2027-01');
  });
});
