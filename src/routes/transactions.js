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

const handleIncome = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [accounts, transactions, flash] = await Promise.all([
    d.getAccounts(user.id),
    d.getTransactions(user.id, 'income'),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(transactionsPage({ user, transactionType: 'income', accounts, transactions, flash }));
};

const handleExpense = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [accounts, transactions, flash] = await Promise.all([
    d.getAccounts(user.id),
    d.getTransactions(user.id, 'expense'),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(transactionsPage({ user, transactionType: 'expense', accounts, transactions, flash }));
};

transactionsRouter.get('/income', handleIncome);
transactionsRouter.get('/incomes', (c) => c.redirect('/income'));
transactionsRouter.get('/expense', handleExpense);
transactionsRouter.get('/expenses', handleExpense);
transactionsRouter.get('/transactions', (c) => c.redirect('/expenses'));

const handleAddTransaction = async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  const isJson = contentType.includes('application/json');

  let body = {};
  if (isJson) {
    try { body = await c.req.json(); } catch(e) {}
  } else {
    try {
      const form = await c.req.formData();
      body = Object.fromEntries(form.entries());
    } catch(e) {}
  }

  const { redirect, session, user } = await requireUser(c);
  if (redirect && !isJson) return c.redirect(redirect);
  if (!user && isJson) return c.json({ error: 'Unauthorized' }, 401);

  const type = (body.type || 'expense').toString();
  const amount = parseFloat(body.amount?.toString() || '0');
  let account_id = parseInt(body.account_id?.toString() || '0');
  const category = (body.category || 'Other').toString().trim();
  const description = (body.description || '').toString().trim();
  const date = (body.date || new Date().toISOString().split('T')[0]).toString();
  const budget_month = date.substring(0, 7);

  const accounts = await db(c.env.DB).getAccounts(user.id);
  if (!account_id && accounts.length > 0) {
    account_id = accounts[0].id;
  }

  if (!type || !amount || !account_id) {
    if (isJson) return c.json({ error: 'Missing required fields' }, 400);
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Missing required fields.');
    return c.redirect(`/${type === 'income' ? 'income' : 'expenses'}`);
  }

  const account = accounts.find(a => a.id === account_id);
  if (!account) {
    if (isJson) return c.json({ error: 'Invalid account' }, 400);
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Invalid account.');
    return c.redirect(`/${type === 'income' ? 'income' : 'expenses'}`);
  }

  const txnId = await db(c.env.DB).createTransaction({
    user_id: user.id, type, amount, account_id, category, description, date, budget_month
  });

  const delta = type === 'income' ? amount : -amount;
  await db(c.env.DB).adjustBalance(account_id, delta);

  if (isJson) {
    return c.json({ success: true, transaction_id: txnId, message: `${type === 'income' ? 'Income' : 'Expense'} of SAR ${amount.toFixed(2)} added.` });
  }

  await setFlash(c.env.SESSIONS, session.token, 'success', `${type === 'income' ? 'Income' : 'Expense'} of SAR ${amount.toFixed(2)} added.`);
  return c.redirect(`/${type === 'income' ? 'income' : 'expenses'}`);
};

transactionsRouter.post('/transaction', handleAddTransaction);
transactionsRouter.post('/transaction/add', handleAddTransaction);
transactionsRouter.post('/transactions', handleAddTransaction);
transactionsRouter.post('/api/transaction', handleAddTransaction);

const handleDeleteTransaction = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id') || '0');
  const d = db(c.env.DB);

  const txns = await d.getTransactions(user.id, 'all');
  const txn = txns.find(t => t.id === id);
  if (txn) {
    const delta = txn.type === 'income' ? -txn.amount : txn.amount;
    await d.adjustBalance(txn.account_id, delta);
    await d.deleteTransactionById(id, user.id);
    await setFlash(c.env.SESSIONS, session.token, 'success', 'Transaction deleted.');
  }

  const referer = c.req.header('Referer') || '/expenses';
  return c.redirect(referer);
};

transactionsRouter.post('/transaction/:id/delete', handleDeleteTransaction);
transactionsRouter.post('/transaction/delete/:id', handleDeleteTransaction);
