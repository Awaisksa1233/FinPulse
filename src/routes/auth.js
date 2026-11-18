import { Hono } from 'hono';
import { db } from '../db.js';
import {
  hashPassword, verifyPassword, createSession, destroySession,
  getSession, setCookieHeader, clearCookieHeader,
  generateLinkCode, setFlash
} from '../auth.js';
import { authPage } from '../templates/auth.js';

export const authRouter = new Hono();

authRouter.get('/login', async (c) => {
  const session = await getSession(c);
  if (session) return c.redirect('/');
  return c.html(authPage({ mode: 'login', flash: [] }));
});

authRouter.get('/register', async (c) => {
  const session = await getSession(c);
  if (session) return c.redirect('/');
  return c.html(authPage({ mode: 'register', flash: [] }));
});

authRouter.post('/login', async (c) => {
  const form = await c.req.formData();
  const email = form.get('email')?.toString().trim().toLowerCase() || '';
  const password = form.get('password')?.toString() || '';

  if (!email || !password) {
    return c.html(authPage({ mode: 'login', flash: [{ type: 'error', message: 'Email and password required.' }] }));
  }

  const user = await db(c.env.DB).getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html(authPage({ mode: 'login', flash: [{ type: 'error', message: 'Invalid email or password.' }] }));
  }

  const remember = form.get('remember') !== null;
  const { token, header } = await createSession(c.env.SESSIONS, user.id, remember);
  const res = c.redirect('/');
  res.headers.set('Set-Cookie', header);
  return res;
});

authRouter.post('/register', async (c) => {
  const form = await c.req.formData();
  const email = form.get('email')?.toString().trim().toLowerCase() || '';
  const password = form.get('password')?.toString() || '';
  const fullName = form.get('full_name')?.toString().trim() || '';

  if (!email || !password || password.length < 8) {
    return c.html(authPage({ mode: 'register', flash: [{ type: 'error', message: 'All fields required. Password must be 8+ chars.' }] }));
  }

  const existing = await db(c.env.DB).getUserByEmail(email);
  if (existing) {
    return c.html(authPage({ mode: 'register', flash: [{ type: 'error', message: 'Email already registered.' }] }));
  }

  const hash = await hashPassword(password);
  const userId = await db(c.env.DB).createUser({ email, password_hash: hash, full_name: fullName });

  const { token, header } = await createSession(c.env.SESSIONS, userId, true);
  const res = c.redirect('/');
  res.headers.set('Set-Cookie', header);
  return res;
});

const handleLogout = async (c) => {
  const session = await getSession(c);
  if (session) await destroySession(c.env.SESSIONS, session.token);
  const res = c.redirect('/login');
  res.headers.set('Set-Cookie', clearCookieHeader());
  return res;
};

authRouter.get('/logout', handleLogout);
authRouter.post('/logout', handleLogout);
authRouter.get('/signin', (c) => c.redirect('/login'));
authRouter.get('/signup', (c) => c.redirect('/register'));

// Telegram login via code
const handleTelegramLogin = async (c) => {
  const form = await c.req.formData();
  const code = form.get('code')?.toString().trim().toUpperCase() || '';
  const remember = form.get('remember') !== null;

  if (!code) {
    return c.html(authPage({ mode: 'login', flash: [{ type: 'error', message: 'Please enter the code from Telegram.' }] }));
  }

  // Look up code in KV
  const codeKey = `tg_link:${code}`;
  const userId = await c.env.SESSIONS.get(codeKey);
  if (!userId) {
    return c.html(authPage({ mode: 'login', flash: [{ type: 'error', message: 'Invalid or expired code.' }] }));
  }

  const user = await db(c.env.DB).getUserById(parseInt(userId));
  if (!user) {
    return c.html(authPage({ mode: 'login', flash: [{ type: 'error', message: 'User not found.' }] }));
  }

  await c.env.SESSIONS.delete(codeKey);

  const { token, header } = await createSession(c.env.SESSIONS, user.id, remember);
  const res = c.redirect('/');
  res.headers.set('Set-Cookie', header);
  return res;
};

authRouter.get('/login/telegram', (c) => c.redirect('/login'));
authRouter.post('/login/telegram', handleTelegramLogin);
authRouter.post('/login/telegram-code', handleTelegramLogin);

// ── JSON API Auth Endpoints for SPA ──────────────────────────────
authRouter.get('/api/auth/me', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ authenticated: false, user: null }, 401);
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return c.json({ authenticated: false, user: null }, 401);
  return c.json({
    authenticated: true,
    user: { id: user.id, full_name: user.full_name, email: user.email, salary_day: user.salary_day || 28 }
  });
});

authRouter.post('/api/auth/login', async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch(e) {
    try {
      const form = await c.req.formData();
      body = Object.fromEntries(form.entries());
    } catch(err) {}
  }

  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  if (!email || !password) {
    return c.json({ success: false, error: 'Email and password required.' }, 400);
  }

  const user = await db(c.env.DB).getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ success: false, error: 'Invalid email or password.' }, 401);
  }

  const remember = body.remember !== false;
  const { token, header } = await createSession(c.env.SESSIONS, user.id, remember);
  const res = c.json({
    success: true,
    user: { id: user.id, full_name: user.full_name, email: user.email, salary_day: user.salary_day || 28 }
  });
  res.headers.set('Set-Cookie', header);
  return res;
});

authRouter.post('/api/auth/register', async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch(e) {
    try {
      const form = await c.req.formData();
      body = Object.fromEntries(form.entries());
    } catch(err) {}
  }

  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  const fullName = (body.full_name || body.name || '').toString().trim();

  if (!email || !password || password.length < 8) {
    return c.json({ success: false, error: 'All fields required. Password must be 8+ chars.' }, 400);
  }

  const existing = await db(c.env.DB).getUserByEmail(email);
  if (existing) {
    return c.json({ success: false, error: 'Email already registered.' }, 400);
  }

  const hash = await hashPassword(password);
  const userId = await db(c.env.DB).createUser({ email, password_hash: hash, full_name: fullName });

  // Create default accounts for new user (Checking, Vault, Cash)
  const d = db(c.env.DB);
  await Promise.all([
    d.createAccount({ user_id: userId, name: 'Al Rajhi Main', type: 'bank', balance: 10000, color: '#3b82f6' }),
    d.createAccount({ user_id: userId, name: 'SNB High-Yield Vault', type: 'savings', balance: 15000, color: '#10b981' }),
    d.createAccount({ user_id: userId, name: 'Cash Wallet', type: 'cash', balance: 500, color: '#a855f7' }),
  ]);

  const { token, header } = await createSession(c.env.SESSIONS, userId, true);
  const res = c.json({
    success: true,
    user: { id: userId, full_name: fullName, email, salary_day: 28 }
  });
  res.headers.set('Set-Cookie', header);
  return res;
});

authRouter.post('/api/auth/logout', async (c) => {
  const session = await getSession(c);
  if (session) await destroySession(c.env.SESSIONS, session.token);
  const res = c.json({ success: true });
  res.headers.set('Set-Cookie', clearCookieHeader());
  return res;
});

