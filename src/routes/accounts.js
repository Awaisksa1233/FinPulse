import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { accountsPage } from '../templates/accounts.js';
import { getBudgetMonth } from '../utils/date.js';

export const accountsRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

accountsRouter.get('/accounts', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const [accounts, flash] = await Promise.all([
    db(c.env.DB).getAccounts(user.id),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(accountsPage({ user, accounts, flash }));
});

accountsRouter.get('/account', (c) => c.redirect('/accounts'));

// API endpoint for accounts
accountsRouter.get('/api/accounts', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const accounts = await db(c.env.DB).getAccounts(user.id);
  return c.json({ success: true, accounts });
});

const handleCreateAccount = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const name = form.get('name')?.toString().trim() || '';
  const type = form.get('type')?.toString() || 'bank';
  const balance = parseFloat(form.get('balance')?.toString() || '0');
  const color = form.get('color')?.toString() || '#6366f1';

  if (!name) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Account name required.');
    return c.redirect('/accounts');
  }

  await db(c.env.DB).createAccount({ user_id: user.id, name, type, balance, color });
  await setFlash(c.env.SESSIONS, session.token, 'success', `Account "${name}" created.`);
  return c.redirect('/accounts');
};

accountsRouter.post('/account', handleCreateAccount);
accountsRouter.post('/account/add', handleCreateAccount);
accountsRouter.post('/accounts/add', handleCreateAccount);

const handleEditAccount = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const id = parseInt(c.req.param('id') || form.get('id')?.toString() || '0');
  const name = form.get('name')?.toString().trim() || '';
  const color = form.get('color')?.toString() || '#6366f1';

  // Verify ownership
  const accounts = await db(c.env.DB).getAccounts(user.id);
  if (!accounts.find(a => a.id === id)) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Account not found.');
    return c.redirect('/accounts');
  }

  await db(c.env.DB).updateAccount(id, { name, color });
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Account updated.');
  return c.redirect('/accounts');
};

accountsRouter.post('/account/:id/edit', handleEditAccount);
accountsRouter.post('/account/edit', handleEditAccount);

const handleDeleteAccount = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id') || '0');
  const accounts = await db(c.env.DB).getAccounts(user.id);
  if (!accounts.find(a => a.id === id)) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Account not found.');
    return c.redirect('/accounts');
  }

  await db(c.env.DB).deleteAccount(id, user.id);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Account deleted.');
  return c.redirect('/accounts');
};

accountsRouter.post('/account/:id/delete', handleDeleteAccount);
accountsRouter.post('/account/delete/:id', handleDeleteAccount);

// Quick Transfer between accounts
accountsRouter.post('/transfer', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const from_id = parseInt(form.get('from_account_id')?.toString() || form.get('from_id')?.toString() || '0');
  const to_id = parseInt(form.get('to_account_id')?.toString() || form.get('to_id')?.toString() || '0');
  const amount = parseFloat(form.get('amount')?.toString() || '0');
  const description = form.get('description')?.toString().trim() || 'Transfer';

  if (!from_id || !to_id || !amount || from_id === to_id) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Invalid transfer details.');
    return c.redirect('/accounts');
  }

  const accounts = await db(c.env.DB).getAccounts(user.id);
  const from = accounts.find(a => a.id === from_id);
  const to = accounts.find(a => a.id === to_id);

  if (!from || !to) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Account not found.');
    return c.redirect('/accounts');
  }

  if (from.balance < amount) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Insufficient balance.');
    return c.redirect('/accounts');
  }

  const d = db(c.env.DB);
  const date = new Date().toISOString().split('T')[0];
  const budget_month = getBudgetMonth(date, user.salary_day || 28);

  // Create matching transactions
  await d.createTransaction({ user_id: user.id, type: 'transfer_out', amount, account_id: from_id, category: 'Transfer', description, date, budget_month });
  await d.createTransaction({ user_id: user.id, type: 'transfer_in', amount, account_id: to_id, category: 'Transfer', description, date, budget_month });
  await d.adjustBalance(from_id, -amount);
  await d.adjustBalance(to_id, amount);

  await setFlash(c.env.SESSIONS, session.token, 'success', `SAR ${amount.toFixed(2)} transferred from ${from.name} to ${to.name}.`);
  return c.redirect('/accounts');
});
