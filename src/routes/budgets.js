import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { budgetsPage } from '../templates/budgets.js';
import { currentBudgetMonth } from '../utils/date.js';

export const budgetsRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

budgetsRouter.get('/budgets', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const month = currentBudgetMonth(user.salary_day || 28);

  const d = db(c.env.DB);
  const [budgets, spendingMap, flash] = await Promise.all([
    d.getBudgets(user.id),
    d.getCategorySpend(user.id, month),
    getFlash(c.env.SESSIONS, session.token),
  ]);

  return c.html(budgetsPage({ user, budgets, spendingMap, flash }));
});

budgetsRouter.get('/budget', (c) => c.redirect('/budgets'));

const handleCreateBudget = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const form = await c.req.formData();
  const category = form.get('category')?.toString().trim() || '';
  const monthly_limit = parseFloat(form.get('monthly_limit')?.toString() || '0');
  const alert_threshold = parseFloat(form.get('alert_threshold')?.toString() || '80') / 100;

  if (!category || monthly_limit <= 0) {
    await setFlash(c.env.SESSIONS, session.token, 'error', 'Category and limit required.');
    return c.redirect('/budgets');
  }

  await db(c.env.DB).createBudget({ user_id: user.id, category, monthly_limit, alert_threshold });
  await setFlash(c.env.SESSIONS, session.token, 'success', `Budget for "${category}" saved.`);
  return c.redirect('/budgets');
};

budgetsRouter.post('/budget', handleCreateBudget);
budgetsRouter.post('/budget/add', handleCreateBudget);

const handleDeleteBudget = async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const id = parseInt(c.req.param('id') || '0');
  await db(c.env.DB).deleteBudget(id, user.id);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Budget deleted.');
  return c.redirect('/budgets');
};

budgetsRouter.post('/budget/:id/delete', handleDeleteBudget);
budgetsRouter.post('/budget/delete/:id', handleDeleteBudget);

// API: AI budget suggestions
const handleBudgetSuggestions = async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const month = currentBudgetMonth(user.salary_day || 28);
  const [categorySpend, budgets] = await Promise.all([
    db(c.env.DB).getCategorySpend(user.id, month),
    db(c.env.DB).getBudgets(user.id),
  ]);

  const { generateBudgetSuggestions } = await import('../services/ai.js');
  const suggestions = await generateBudgetSuggestions(c.env.OPENROUTER_API_KEY || c.env.GROQ_API_KEY, { categorySpend, budgets });
  return c.json({ suggestions });
};

budgetsRouter.get('/api/budget-suggestions', handleBudgetSuggestions);
budgetsRouter.get('/api/budgets/suggestions', handleBudgetSuggestions);
