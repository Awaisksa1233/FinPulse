import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authRouter } from '../src/routes/auth.js';

describe('Auth Route Endpoints', () => {
  it('renders login page with 200 OK', async () => {
    const app = new Hono();
    app.route('/', authRouter);

    const res = await app.request('/login');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Login');
  });

  it('renders register page with 200 OK', async () => {
    const app = new Hono();
    app.route('/', authRouter);

    const res = await app.request('/register');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Register');
  });

  it('validates required fields on login POST', async () => {
    const app = new Hono();
    app.route('/', authRouter);

    const formData = new FormData();
    formData.append('email', '');
    formData.append('password', '');

    const res = await app.request('/login', {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Email and password required.');
  });
});
