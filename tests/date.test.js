import { describe, it, expect } from 'vitest';
import { getBudgetMonth } from '../src/utils/date.js';

describe('KSA Salary Cycle / Budget Month Calculation', () => {
  it('assigns date before salary day (28th) to the current calendar month', () => {
    expect(getBudgetMonth('2026-11-27', 28)).toBe('2026-11');
    expect(getBudgetMonth('2026-11-01', 28)).toBe('2026-11');
    expect(getBudgetMonth('2026-11-15', 28)).toBe('2026-11');
  });

  it('assigns date on salary day (28th) to next month (December)', () => {
    // Salary received on Nov 28 counts towards December
    expect(getBudgetMonth('2026-11-28', 28)).toBe('2026-12');
  });

  it('assigns expenses after salary day in late November to December', () => {
    // All expenses from Nov 28 through Nov 30 count towards December
    expect(getBudgetMonth('2026-11-29', 28)).toBe('2026-12');
    expect(getBudgetMonth('2026-11-30', 28)).toBe('2026-12');
  });

  it('assigns early to mid December expenses to December', () => {
    expect(getBudgetMonth('2026-12-01', 28)).toBe('2026-12');
    expect(getBudgetMonth('2026-12-15', 28)).toBe('2026-12');
    expect(getBudgetMonth('2026-12-27', 28)).toBe('2026-12');
  });

  it('rolls over December 28th to next year January', () => {
    expect(getBudgetMonth('2026-12-28', 28)).toBe('2027-01');
    expect(getBudgetMonth('2026-12-31', 28)).toBe('2027-01');
  });

  it('supports custom salary days (e.g. 25th)', () => {
    expect(getBudgetMonth('2026-11-24', 25)).toBe('2026-11');
    expect(getBudgetMonth('2026-11-25', 25)).toBe('2026-12');
  });
});
