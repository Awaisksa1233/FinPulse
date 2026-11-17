/**
 * Date and salary cycle utilities for FinPulse
 */

/**
 * Calculates the budget month for a given date string or Date object.
 * If day >= salaryDay, it counts towards the NEXT calendar month.
 * e.g., if salaryDay is 28:
 * - 2026-11-27 => 2026-11
 * - 2026-11-28 => 2026-12 (Salary day!)
 * - 2026-11-30 => 2026-12
 * - 2026-12-05 => 2026-12
 * - 2026-12-28 => 2027-01
 *
 * @param {string|Date} [dateInput]
 * @param {number} [salaryDay=28]
 * @returns {string} 'YYYY-MM'
 */
export function getBudgetMonth(dateInput, salaryDay = 28) {
  let year, month, day;
  if (!dateInput) {
    const d = new Date();
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.slice(0, 10).split('-').map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2] || 1;
  } else if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
  } else {
    const d = new Date();
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  const sDay = Math.max(1, Math.min(31, parseInt(salaryDay, 10) || 28));

  if (day >= sDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Returns current active budget month based on today's date and the user's salary cycle day.
 */
export function currentBudgetMonth(salaryDay = 28) {
  return getBudgetMonth(new Date(), salaryDay);
}
