import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash } from '../auth.js';
import { dashboardPage } from '../templates/dashboard.js';
import { generateAISummary } from '../services/ai.js';

export const dashboardRouter = new Hono();

const handleDashboard = async (c) => {
  const session = await getSession(c);
  if (!session) return c.redirect('/login');

  const d = db(c.env.DB);
  const user = await d.getUserById(session.userId);
  if (!user) return c.redirect('/login');

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [accounts, { income, expenses }, recentTransactions, budgets, flash] = await Promise.all([
    d.getAccounts(user.id),
    d.getMonthlyTotals(user.id, month),
    d.getRecentTransactions(user.id, 5),
    d.getBudgets(user.id),
    getFlash(c.env.SESSIONS, session.token),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  // Budget alerts: categories over threshold
  const spendMap = await d.getCategorySpend(user.id, month);
  const budgetAlerts = budgets
    .map(b => ({
      ...b,
      spent: spendMap[b.category] || 0,
      pct: b.monthly_limit > 0 ? (spendMap[b.category] || 0) / b.monthly_limit : 0
    }))
    .filter(b => b.pct >= b.alert_threshold);

  return c.html(dashboardPage({
    user,
    accounts,
    income,
    expenses,
    totalBalance,
    recentTransactions,
    budgetAlerts,
    flash,
  }));
};

dashboardRouter.get('/', handleDashboard);
dashboardRouter.get('/dashboard', (c) => c.redirect('/'));
dashboardRouter.get('/home', (c) => c.redirect('/'));

// API: AI summary for dashboard widget
dashboardRouter.get('/api/summary', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const d = db(c.env.DB);
  const user = await d.getUserById(session.userId);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [{ income, expenses }, categorySpend, accounts] = await Promise.all([
    d.getMonthlyTotals(user.id, month),
    d.getCategorySpend(user.id, month),
    d.getAccounts(user.id),
  ]);

  const summary = await generateAISummary(c.env.OPENROUTER_API_KEY || c.env.GROQ_API_KEY, {
    income, expenses, categorySpend, accounts, month,
  });

  return c.json({ summary });
});
