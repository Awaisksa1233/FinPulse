import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { transactionsPage } from '../templates/transactions.js';

export const transactionsRouter = new Hono();

// Helper to get session+user or redirect
async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

transactionsRouter.get('/income', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [accounts, transactions, flash] = await Promise.all([
    d.getAccounts(user.id),
    d.getTransactions(user.id, 'income'),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(transactionsPage({ user, transactionType: 'income', accounts, transactions, flash }));
});

transactionsRouter.get('/expense', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [accounts, transactions, flash] = await Promise.all([
    d.getAccounts(user.id),
    d.getTransactions(user.id, 'expense'),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(transactionsPage({ user, transactionType: 'expense', accounts, transactions, flash }));
});

transactionsRouter.post('/transaction', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const type = form.get('type')?.toString();
  const amount = parseFloat(form.get('amount')?.toString() || '0');
  const account_id = parseInt(form.get('account_id')?.toString() || '0');
  const category = form.get('category')?.toString().trim() || 'Other';
  const description = form.get('description')?.toString().trim() || '';
  const date = form.get('date')?.toString() || new Date().toISOString().split('T')[0];
  const budget_month = date.substring(0, 7);

  if (!type || !amount || !account_id) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Missing required fields.');
    return c.redirect(`/${type || 'expense'}`);
  }

  // Verify account belongs to user
  const accounts = await db(c.env.DB).getAccounts(user.id);
  const account = accounts.find(a => a.id === account_id);
  if (!account) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Invalid account.');
    return c.redirect(`/${type}`);
  }

  await db(c.env.DB).createTransaction({
    user_id: user.id, type, amount, account_id, category, description, date, budget_month
  });

  // Adjust account balance
  const delta = type === 'income' ? amount : -amount;
  await db(c.env.DB).adjustBalance(account_id, delta);

  await setFlash(c.env.SESSIONS, session.token, 'success', `${type === 'income' ? 'Income' : 'Expense'} of SAR ${amount.toFixed(2)} added.`);
  return c.redirect(`/${type}`);
});

transactionsRouter.post('/transaction/:id/delete', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id'));
  const d = db(c.env.DB);

  // Get transaction to reverse balance
  const txns = await d.getTransactions(user.id, 'all');
  const txn = txns.find(t => t.id === id);
  if (txn) {
    const delta = txn.type === 'income' ? -txn.amount : txn.amount;
    await d.adjustBalance(txn.account_id, delta);
    await d.deleteTransactionById(id, user.id);
    await setFlash(c.env.SESSIONS, session.token, 'success', 'Transaction deleted.');
  }

  const referer = c.req.header('Referer') || '/expense';
  return c.redirect(referer);
});
