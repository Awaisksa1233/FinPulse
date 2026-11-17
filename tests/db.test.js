import { describe, it, expect, vi } from 'vitest';
import { db } from '../src/db.js';

describe('D1 Database Helpers', () => {
  function createMockD1() {
    const executed = [];
    return {
      executed,
      prepare(sql) {
        let boundParams = [];
        const stmt = {
          bind(...params) {
            boundParams = params;
            return stmt;
          },
          async first() {
            executed.push({ sql, boundParams, method: 'first' });
            if (sql.includes('users WHERE id = ?')) {
              return boundParams[0] === 1 ? { id: 1, email: 'user@example.com', full_name: 'Test User' } : null;
            }
            if (sql.includes('users WHERE email = ?')) {
              return boundParams[0] === 'user@example.com' ? { id: 1, email: 'user@example.com' } : null;
            }
            if (sql.includes('INSERT INTO users')) {
              return { id: 99 };
            }
            if (sql.includes('SUM(CASE WHEN type=\'income\'')) {
              return { income: 5000, expenses: 2000 };
            }
            if (sql.includes('INSERT INTO loan_accounts')) {
              return { id: 10 };
            }
            return null;
          },
          async all() {
            executed.push({ sql, boundParams, method: 'all' });
            if (sql.includes('FROM accounts')) {
              return { results: [{ id: 1, name: 'Main Bank', balance: 1500 }] };
            }
            if (sql.includes('GROUP BY category')) {
              return { results: [{ category: 'Food', total: 450 }, { category: 'Transport', total: 120 }] };
            }
            if (sql.includes('FROM transactions')) {
              return { results: [{ id: 1, amount: 50, type: 'expense', category: 'Food' }] };
            }
            return { results: [] };
          },
          async run() {
            executed.push({ sql, boundParams, method: 'run' });
            return { success: true };
          },
        };
        return stmt;
      },
    };
  }

  it('queries user by ID and email', async () => {
    const mockD1 = createMockD1();
    const repository = db(mockD1);

    const user = await repository.getUserById(1);
    expect(user).toEqual({ id: 1, email: 'user@example.com', full_name: 'Test User' });

    const notFound = await repository.getUserById(999);
    expect(notFound).toBeNull();

    const userByEmail = await repository.getUserByEmail('user@example.com');
    expect(userByEmail?.id).toBe(1);
  });

  it('creates user and returns generated ID', async () => {
    const mockD1 = createMockD1();
    const repository = db(mockD1);

    const newId = await repository.createUser({
      email: 'new@example.com',
      password_hash: 'pbkdf2:...',
      full_name: 'New Person',
    });
    expect(newId).toBe(99);
    expect(mockD1.executed[0].boundParams).toEqual(['new@example.com', 'pbkdf2:...', 'New Person']);
  });

  it('handles account management and balance adjustments', async () => {
    const mockD1 = createMockD1();
    const repository = db(mockD1);

    const accounts = await repository.getAccounts(1);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Main Bank');

    await repository.adjustBalance(1, -50.25);
    const lastOp = mockD1.executed[mockD1.executed.length - 1];
    expect(lastOp.sql).toContain('UPDATE accounts SET balance = balance + ?');
    expect(lastOp.boundParams).toEqual([-50.25, 1]);
  });

  it('calculates monthly totals and category spending map', async () => {
    const mockD1 = createMockD1();
    const repository = db(mockD1);

    const totals = await repository.getMonthlyTotals(1, '2026-11');
    expect(totals).toEqual({ income: 5000, expenses: 2000 });

    const spendMap = await repository.getCategorySpend(1, '2026-11');
    expect(spendMap).toEqual({
      Food: 450,
      Transport: 120,
    });
  });
});
