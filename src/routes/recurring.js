import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { recurringPage } from '../templates/recurring.js';

export const recurringRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

recurringRouter.get('/recurring', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [templates, accounts, flash] = await Promise.all([
    d.getRecurring(user.id),
    d.getAccounts(user.id),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(recurringPage({ user, templates, accounts, flash }));
});

const handleCreateRecurring = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const type = form.get('type')?.toString() || 'expense';
  const description = form.get('description')?.toString().trim() || '';
  const category = form.get('category')?.toString().trim() || 'Other';
  const amount = parseFloat(form.get('amount')?.toString() || '0');
  const account_id = parseInt(form.get('account_id')?.toString() || '0');
  const frequency = form.get('frequency')?.toString() || 'monthly';
  const start_date = form.get('start_date')?.toString() || '';

  if (!description || amount <= 0 || !account_id || !start_date) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'All fields required.');
    return c.redirect('/recurring');
  }

  // Calculate next_date based on frequency and start_date
  const next_date = start_date;

  await db(c.env.DB).createRecurring({
    user_id: user.id, type, description, category, amount, account_id, frequency, start_date, next_date
  });

  await setFlash(c.env.SESSIONS, session.token, 'success', `Recurring "${description}" added.`);
  return c.redirect('/recurring');
};

recurringRouter.post('/recurring', handleCreateRecurring);
recurringRouter.post('/recurring/add', handleCreateRecurring);

const handleDeleteRecurring = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id') || '0');
  await db(c.env.DB).deleteRecurring(id, user.id);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Recurring template deleted.');
  return c.redirect('/recurring');
};

recurringRouter.post('/recurring/:id/delete', handleDeleteRecurring);
recurringRouter.post('/recurring/delete/:id', handleDeleteRecurring);

recurringRouter.post('/recurring/pause/:id', async (c) => {
  const { redirect, session } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  await setFlash(c.env.SESSIONS, session.token, 'info', 'Recurring template paused.');
  return c.redirect('/recurring');
});

recurringRouter.post('/recurring/resume/:id', async (c) => {
  const { redirect, session } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Recurring template resumed.');
  return c.redirect('/recurring');
});

recurringRouter.get('/recurring/templates', (c) => c.redirect('/recurring'));

// Process recurring templates (called by cron or admin)
export async function processRecurringTemplates(env) {
  const today = new Date().toISOString().split('T')[0];
  const d = db(env.DB);

  // Get all templates due today or earlier
  const { results } = await env.DB.prepare(
    `SELECT rt.*, u.id as uid FROM recurring_templates rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.next_date <= ? AND rt.is_active = 1`
  ).bind(today).all();

  for (const t of results) {
    // Create transaction
    const budget_month = today.substring(0, 7);
    await d.createTransaction({
      user_id: t.user_id, type: t.type, amount: t.amount,
      account_id: t.account_id, category: t.category,
      description: t.description + ' (auto)', date: today, budget_month
    });

    const delta = t.type === 'income' ? t.amount : -t.amount;
    await d.adjustBalance(t.account_id, delta);

    // Advance next_date
    const next = advanceDate(t.next_date, t.frequency);
    await env.DB.prepare(`UPDATE recurring_templates SET next_date = ? WHERE id = ?`).bind(next, t.id).run();
  }

  return results.length;
}

function advanceDate(dateStr, frequency) {
  const d = new Date(dateStr);
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}
