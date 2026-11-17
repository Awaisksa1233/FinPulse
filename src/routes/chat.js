import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash } from '../auth.js';
import { chatPage } from '../templates/chat.js';
import { processChat } from '../services/ai.js';
import { currentBudgetMonth, getBudgetMonth } from '../utils/date.js';

export const chatRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

chatRouter.get('/chat', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const [messages, flash] = await Promise.all([
    db(c.env.DB).getChatHistory(user.id),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(chatPage({ user, messages, flash }));
});

const handleChat = async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  const accept = c.req.header('Accept') || '';
  const isJson = contentType.includes('application/json') || accept.includes('application/json');

  const { redirect, session, user } = await requireUser(c);
  if (redirect && !isJson) return c.redirect(redirect);
  if (!user && isJson) return c.json({ error: 'Unauthorized' }, 401);

  let message = '';
  if (contentType.includes('application/json')) {
    try {
      const data = await c.req.json();
      message = (data.message || data.text || '').toString().trim();
    } catch(e) {}
  } else {
    try {
      const form = await c.req.formData();
      message = form.get('message')?.toString().trim() || form.get('text')?.toString().trim() || '';
    } catch(e) {}
  }

  if (!message) {
    if (isJson) return c.json({ response: 'Please enter a message.', message: 'Please enter a message.' });
    return c.redirect('/chat');
  }

  const d = db(c.env.DB);

  // Save user message
  await d.addChatMessage(user.id, 'user', message);

  // Get conversation history (last 10 messages for context)
  const history = await d.getChatHistory(user.id, 10);

  // Get financial context for AI
  const now = new Date();
  const month = currentBudgetMonth(user.salary_day || 28);
  const [accounts, { income, expenses }, categorySpend] = await Promise.all([
    d.getAccounts(user.id),
    d.getMonthlyTotals(user.id, month),
    d.getCategorySpend(user.id, month),
  ]);

  const context = {
    accounts: accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance, type: a.type })),
    monthlyIncome: income,
    monthlyExpenses: expenses,
    categorySpend,
    today: now.toISOString().split('T')[0],
    month,
  };

  let reply = '';

  try {
    const result = await processChat(c.env.OPENROUTER_API_KEY || c.env.GROQ_API_KEY, history, message, context);

    // Check if AI returned an action JSON
    if (result && typeof result === 'object' && result.action) {
      reply = await executeAIAction(result, user, d, c.env.SESSIONS, session.token);
    } else {
      reply = typeof result === 'string' ? result : result.message || 'I could not process that.';
    }
  } catch (err) {
    console.error('Chat AI error:', err);
    reply = 'Sorry, I had trouble processing that. Please try again.';
  }

  await d.addChatMessage(user.id, 'assistant', reply);

  if (isJson) {
    return c.json({ response: reply, message: reply });
  }

  return c.redirect('/chat');
};

chatRouter.post('/chat', handleChat);
chatRouter.post('/api/chat', handleChat);
chatRouter.post('/api/ai', handleChat);

const handleChatClear = async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  const isJson = contentType.includes('application/json');

  const { redirect, session, user } = await requireUser(c);
  if (redirect && !isJson) return c.redirect(redirect);
  if (!user && isJson) return c.json({ error: 'Unauthorized' }, 401);

  await db(c.env.DB).clearChatHistory(user.id);

  if (isJson) {
    return c.json({ success: true, message: 'Chat history cleared.' });
  }

  await setFlash(c.env.SESSIONS, session.token, 'success', 'Chat history cleared.');
  return c.redirect('/chat');
};

chatRouter.post('/chat/clear', handleChatClear);
chatRouter.post('/api/chat/clear', handleChatClear);

async function executeAIAction(action, user, d, kv, token) {
  const today = new Date().toISOString().split('T')[0];
  const budget_month = action.budget_month || getBudgetMonth(action.date || today, user.salary_day || 28);

  if (action.action === 'transaction') {
    const { type, amount, category, description, account_name } = action;
    if (!type || !amount) return 'I understood you want to add a transaction, but I need at least the type and amount.';

    const accounts = await d.getAccounts(user.id);
    let account = accounts[0];
    if (account_name) {
      const match = accounts.find(a => a.name.toLowerCase().includes(account_name.toLowerCase()));
      if (match) account = match;
    }
    if (!account) return 'You have no accounts set up. Please add an account first.';

    await d.createTransaction({
      user_id: user.id, type, amount: parseFloat(amount),
      account_id: account.id, category: category || 'Other',
      description: description || '', date: action.date || today, budget_month
    });

    const delta = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
    await d.adjustBalance(account.id, delta);

    return `✅ Added ${type} of SAR ${parseFloat(amount).toFixed(2)} for "${category || 'Other'}" to ${account.name}.`;
  }

  if (action.action === 'transfer') {
    const { from_account, to_account, amount } = action;
    const accounts = await d.getAccounts(user.id);
    const from = accounts.find(a => a.name.toLowerCase().includes((from_account || '').toLowerCase()));
    const to = accounts.find(a => a.name.toLowerCase().includes((to_account || '').toLowerCase()));
    if (!from || !to) return `I couldn't find the accounts. Available: ${accounts.map(a => a.name).join(', ')}.`;
    if (from.balance < amount) return `Insufficient balance in ${from.name} (SAR ${from.balance.toFixed(2)}).`;

    const a = parseFloat(amount);
    await d.createTransaction({ user_id: user.id, type: 'transfer_out', amount: a, account_id: from.id, category: 'Transfer', description: 'AI Transfer', date: today, budget_month });
    await d.createTransaction({ user_id: user.id, type: 'transfer_in', amount: a, account_id: to.id, category: 'Transfer', description: 'AI Transfer', date: today, budget_month });
    await d.adjustBalance(from.id, -a);
    await d.adjustBalance(to.id, a);

    return `✅ Transferred SAR ${a.toFixed(2)} from ${from.name} to ${to.name}.`;
  }

  if (action.action === 'loan') {
    const { person_name, amount, note } = action;
    if (!person_name || !amount) return 'I need a person name and amount to record a loan.';

    const loans = await d.getLoanAccounts(user.id);
    let loan = loans.find(l => l.person_name.toLowerCase().includes(person_name.toLowerCase()));
    if (!loan) {
      const id = await d.createLoanAccount({ user_id: user.id, person_name, description: '' });
      loan = { id };
    }
    await d.createLoanEntry({ loan_account_id: loan.id, amount: parseFloat(amount), note: note || '', date: today });
    return `✅ Recorded loan of SAR ${parseFloat(amount).toFixed(2)} to ${person_name}.`;
  }

  return action.message || 'Done!';
}
