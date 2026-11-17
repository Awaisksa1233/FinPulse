import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { settingsPage } from '../templates/settings.js';

export const settingsRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

settingsRouter.get('/settings', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const flash = await getFlash(c.env.SESSIONS, session.token);
  return c.html(settingsPage({ user, flash }));
});

settingsRouter.post('/settings/salary-cycle', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const rawDay = parseInt(form.get('salary_day')?.toString() || '28', 10);
  const salary_day = Math.max(1, Math.min(31, isNaN(rawDay) ? 28 : rawDay));

  const d = db(c.env.DB);
  await d.updateUserSettings(user.id, { salary_day });

  await setFlash(c.env.SESSIONS, session.token, 'success', `Salary cycle updated: Transactions on or after day ${salary_day} will count toward next month's budget.`);
  return c.redirect('/settings');
});

settingsRouter.post('/settings/reassign-budget-months', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const d = db(c.env.DB);
  await d.reassignBudgetMonths(user.id, user.salary_day || 28);

  await setFlash(c.env.SESSIONS, session.token, 'success', `Successfully recalculated budget months for your transactions based on salary day ${user.salary_day || 28}.`);
  return c.redirect('/settings');
});

settingsRouter.post('/settings/profile', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const full_name = form.get('full_name')?.toString().trim();

  const d = db(c.env.DB);
  await d.updateUserSettings(user.id, { full_name: full_name || null });

  await setFlash(c.env.SESSIONS, session.token, 'success', 'Profile updated successfully.');
  return c.redirect('/settings');
});
