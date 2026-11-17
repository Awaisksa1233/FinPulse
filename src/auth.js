// Session & password helpers using Web Crypto (Cloudflare Workers compatible)

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
const COOKIE_NAME = 'fp_session';

// ── Password Hashing (PBKDF2) ───────────────────────────────────────────────

async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
    keyMaterial, 256
  );
  const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${salt}:${hash}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith('pbkdf2:')) return false;
  const [, saltHex, expectedHash] = storedHash.split(':');
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
    keyMaterial, 256
  );
  const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === expectedHash;
}

// ── Session Token ───────────────────────────────────────────────────────────

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiToken() {
  return generateToken();
}

function generateLinkCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) code += chars[b % chars.length];
  return code;
}

// ── KV Session Management ───────────────────────────────────────────────────

async function createSession(SESSIONS, userId, remember = true) {
  const token = generateToken();
  const ttl = remember ? SESSION_TTL : 3600;
  await SESSIONS.put(`session:${token}`, JSON.stringify({ userId, createdAt: Date.now() }), { expirationTtl: ttl });
  return { token, ttl };
}

async function getSession(SESSIONS, request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const data = await SESSIONS.get(`session:${token}`);
  if (!data) return null;
  return JSON.parse(data);
}

async function destroySession(SESSIONS, request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) await SESSIONS.delete(`session:${match[1]}`);
}

function setCookieHeader(token, ttl) {
  const expires = ttl > 0 ? `; Max-Age=${ttl}; Expires=${new Date(Date.now() + ttl * 1000).toUTCString()}` : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${expires}`;
}

function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ── Flash Messages (stored in KV) ───────────────────────────────────────────

async function setFlash(SESSIONS, request, messages) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return;
  const token = match[1];
  const data = await SESSIONS.get(`session:${token}`);
  if (!data) return;
  const session = JSON.parse(data);
  session.flash = messages;
  await SESSIONS.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });
}

async function getFlash(SESSIONS, request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return [];
  const token = match[1];
  const data = await SESSIONS.get(`session:${token}`);
  if (!data) return [];
  const session = JSON.parse(data);
  const flash = session.flash || [];
  if (flash.length) {
    session.flash = [];
    await SESSIONS.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });
  }
  return flash;
}

export { hashPassword, verifyPassword, generateToken, generateApiToken, generateLinkCode, createSession, getSession, destroySession, setCookieHeader, clearCookieHeader, setFlash, getFlash };
