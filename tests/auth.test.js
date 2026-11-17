import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateApiToken,
  generateLinkCode,
  createSession,
  getSession,
  destroySession,
  setCookieHeader,
  clearCookieHeader,
  setFlash,
  getFlash,
} from '../src/auth.js';

describe('Auth Helpers & Cryptography', () => {
  it('hashes and verifies passwords correctly with PBKDF2', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^pbkdf2:[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('rejects invalid or corrupted hashes', async () => {
    expect(await verifyPassword('password', null)).toBe(false);
    expect(await verifyPassword('password', '')).toBe(false);
    expect(await verifyPassword('password', 'md5:xyz')).toBe(false);
  });

  it('generates secure random tokens and link codes', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);

    const apiToken = generateApiToken();
    expect(apiToken).toHaveLength(64);

    const linkCode = generateLinkCode();
    expect(linkCode).toHaveLength(8);
    // Link code uses uppercase letters and digits without confusing chars
    expect(linkCode).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('creates and manages session in KV store', async () => {
    const kvStore = new Map();
    const mockKV = {
      async put(key, value, options) {
        kvStore.set(key, { value, options });
      },
      async get(key) {
        return kvStore.get(key)?.value || null;
      },
      async delete(key) {
        kvStore.delete(key);
      },
    };

    const session = await createSession(mockKV, 42, true);
    expect(session.token).toBeDefined();
    expect(session.header).toContain('fp_session=');

    // Retrieve session
    const retrieved = await getSession(mockKV, session.token);
    expect(retrieved).not.toBeNull();
    expect(retrieved.userId).toBe(42);

    // Destroy session
    await destroySession(mockKV, session.token);
    const afterDestroy = await getSession(mockKV, session.token);
    expect(afterDestroy).toBeNull();
  });

  it('handles flash messages in KV store', async () => {
    const kvStore = new Map();
    const token = 'test-token-flash';
    kvStore.set(`session:${token}`, JSON.stringify({ userId: 1 }));

    const mockKV = {
      async put(key, value) {
        kvStore.set(key, { value });
      },
      async get(key) {
        const item = kvStore.get(key);
        return typeof item === 'object' && item?.value ? item.value : item;
      },
    };

    await setFlash(mockKV, token, 'success', 'Transaction saved successfully');

    const flashes = await getFlash(mockKV, token);
    expect(flashes).toHaveLength(1);
    expect(flashes[0].message).toBe('Transaction saved successfully');

    // Second read should be empty (flash consumed)
    const emptyFlashes = await getFlash(mockKV, token);
    expect(emptyFlashes).toHaveLength(0);
  });

  it('formats cookie headers properly', () => {
    const cookie = setCookieHeader('test_token', 3600);
    expect(cookie).toContain('fp_session=test_token');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const clearCookie = clearCookieHeader();
    expect(clearCookie).toContain('Max-Age=0');
  });
});
