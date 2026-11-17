import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash } from '../auth.js';
import { reportsPage } from '../templates/reports.js';
import { generateStoryReport } from '../services/ai.js';

export const reportsRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

reportsRouter.get('/reports', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const month = c.req.query('month') || currentMonth();

  const d = db(c.env.DB);
  const [{ income, expenses }, categorySpend, flash] = await Promise.all([
    d.getMonthlyTotals(user.id, month),
    d.getCategorySpend(user.id, month),
    getFlash(c.env.SESSIONS, session.token),
  ]);

  // Get daily spending for heatmap
  const { results: dailyRows } = await c.env.DB.prepare(
    `SELECT date, SUM(amount) as total
     FROM transactions
     WHERE user_id = ? AND type = 'expense' AND date LIKE ?
     GROUP BY date ORDER BY date`
  ).bind(user.id, `${month}%`).all();

  const dailySpend = {};
  for (const row of dailyRows) {
    dailySpend[row.date] = row.total;
  }

  return c.html(reportsPage({ user, month, income, expenses, categorySpend, dailySpend, flash }));
});

reportsRouter.get('/report', (c) => c.redirect('/reports'));
reportsRouter.post('/reports', (c) => c.redirect('/reports'));

// API: AI story report (async, called by frontend)
reportsRouter.get('/api/story', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const month = c.req.query('month') || currentMonth();
  const d = db(c.env.DB);
  const [{ income, expenses }, categorySpend, recentTxns] = await Promise.all([
    d.getMonthlyTotals(user.id, month),
    d.getCategorySpend(user.id, month),
    d.getRecentTransactions(user.id, 10),
  ]);

  const story = await generateStoryReport(c.env.OPENROUTER_API_KEY || c.env.GROQ_API_KEY, {
    month, income, expenses, categorySpend, recentTxns, name: user.full_name || user.email
  });

  return c.json({ story });
});
