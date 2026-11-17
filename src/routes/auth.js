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
