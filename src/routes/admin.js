import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { adminPage } from '../templates/admin.js';
import { processRecurringTemplates } from './recurring.js';
import { sendDailyReports } from './telegram.js';

export const adminRouter = new Hono();

async function requireAdmin(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  if (!user.is_admin) return { redirect: '/' };
  return { session, user };
}

adminRouter.get('/admin', async (c) => {
  const { redirect, session, user } = await requireAdmin(c);
  if (redirect) return c.redirect(redirect);

  const d = db(c.env.DB);
  const [users, flash] = await Promise.all([
    d.getAllUsers(),
    getFlash(c.env.SESSIONS, session.token),
  ]);

  // Aggregate stats
  const { results: statsRows } = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM transactions) as total_transactions,
      (SELECT COUNT(*) FROM accounts) as total_accounts,
      (SELECT COUNT(*) FROM budgets) as total_budgets
  `).all();
  const stats = statsRows[0] || {};

  return c.html(adminPage({ user, users, stats, flash }));
});

adminRouter.post('/admin/user/:id/delete', async (c) => {
  const { redirect, session, user } = await requireAdmin(c);
  if (redirect) return c.redirect(redirect);

  const targetId = parseInt(c.req.param('id'));
  if (targetId === user.id) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Cannot delete yourself.');
    return c.redirect('/admin');
  }

  // Delete user and all their data
  await c.env.DB.prepare(`DELETE FROM transactions WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM accounts WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM budgets WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM recurring_templates WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM chat_messages WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM telegram_users WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM loan_entries WHERE loan_account_id IN (SELECT id FROM loan_accounts WHERE user_id = ?)`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM loan_accounts WHERE user_id = ?`).bind(targetId).run();
  await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(targetId).run();

  await setFlash(c.env.SESSIONS, session.token, 'success', 'User deleted.');
  return c.redirect('/admin');
});

adminRouter.post('/admin/process-recurring', async (c) => {
  const { redirect, session, user } = await requireAdmin(c);
  if (redirect) return c.redirect(redirect);

  const count = await processRecurringTemplates(c.env);
  await setFlash(c.env.SESSIONS, session.token, 'success', `Processed ${count} recurring template(s).`);
  return c.redirect('/admin');
});

adminRouter.post('/admin/send-daily-reports', async (c) => {
  const { redirect, session, user } = await requireAdmin(c);
  if (redirect) return c.redirect(redirect);

  await sendDailyReports(c.env);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Daily reports sent.');
  return c.redirect('/admin');
});
