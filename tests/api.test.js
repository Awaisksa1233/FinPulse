import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { dashboardRouter } from '../src/routes/dashboard.js';
import { transactionsRouter } from '../src/routes/transactions.js';
import { accountsRouter } from '../src/routes/accounts.js';
import { budgetsRouter } from '../src/routes/budgets.js';
import { authRouter } from '../src/routes/auth.js';

describe('FinPulse SPA REST API Endpoints', () => {
  it('returns 401 Unauthorized for unauthenticated /api/dashboard requests', async () => {
    const app = new Hono();
    app.route('/', dashboardRouter);

    const res = await app.request('/api/dashboard');
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 401 Unauthorized for unauthenticated /api/transactions requests', async () => {
    const app = new Hono();
    app.route('/', transactionsRouter);

    const res = await app.request('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('returns 401 Unauthorized for unauthenticated /api/accounts requests', async () => {
    const app = new Hono();
    app.route('/', accountsRouter);

    const res = await app.request('/api/accounts');
    expect(res.status).toBe(401);
  });

  it('returns 401 Unauthorized for unauthenticated /api/budgets requests', async () => {
    const app = new Hono();
    app.route('/', budgetsRouter);

    const res = await app.request('/api/budgets');
    expect(res.status).toBe(401);
  });

  it('handles /api/auth/me for unauthenticated requests', async () => {
    const app = new Hono();
    app.route('/', authRouter);

    const res = await app.request('/api/auth/me');
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('validates missing fields on /api/auth/login', async () => {
    const app = new Hono();
    app.route('/', authRouter);

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Email and password required');
  });
});
