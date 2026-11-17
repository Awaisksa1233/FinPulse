import { Hono } from 'hono';
import { db } from '../db.js';
import { getSession, getFlash, setFlash, generateLinkCode } from '../auth.js';
import { telegramPage } from '../templates/telegram.js';
import { tgApi, formatTelegramMessage } from '../services/telegram.js';
import { processChat } from '../services/ai.js';

export const telegramRouter = new Hono();

async function requireUser(c) {
  const session = await getSession(c);
  if (!session) return { redirect: '/login' };
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return { redirect: '/login' };
  return { session, user };
}

telegramRouter.get('/telegram', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const d = db(c.env.DB);
  const [tgUser, flash] = await Promise.all([
    d.getTelegramUser(user.id),
    getFlash(c.env.SESSIONS, session.token),
  ]);
  return c.html(telegramPage({ user, tgUser, linkCode: null, flash }));
});

telegramRouter.post('/telegram/generate-code', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);

  const code = generateLinkCode();
  // Store code -> userId in KV with 10 min TTL
  await c.env.SESSIONS.put(`tg_link:${code}`, String(user.id), { expirationTtl: 600 });

  const d = db(c.env.DB);
  const tgUser = await d.getTelegramUser(user.id);
  const flash = await getFlash(c.env.SESSIONS, session.token);
  return c.html(telegramPage({ user, tgUser, linkCode: code, flash }));
});

telegramRouter.post('/telegram/disconnect', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  await db(c.env.DB).deleteTelegramUser(user.id);
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Telegram disconnected.');
  return c.redirect('/telegram');
});

telegramRouter.post('/telegram/settings', async (c) => {
  const { redirect, session, user } = await requireUser(c);
  if (redirect) return c.redirect(redirect);
  const form = await c.req.formData();
  const report_time = form.get('report_time')?.toString() || '08:00';
  const enabled = form.get('daily_report_enabled') === '1';
  await db(c.env.DB).updateTelegramSettings(user.id, { report_time, enabled });
  await setFlash(c.env.SESSIONS, session.token, 'success', 'Telegram settings saved.');
  return c.redirect('/telegram');
});

// Telegram Webhook — receives messages from Telegram Bot API
telegramRouter.post('/telegram/webhook', async (c) => {
  const botToken = c.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return c.json({ ok: false }, 500);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false });
  }

  const message = body?.message;
  if (!message) return c.json({ ok: true });

  const chatId = message.chat?.id;
  const text = message.text?.trim() || '';
  const tgUsername = message.from?.username || '';

  if (!chatId || !text) return c.json({ ok: true });

  const tg = tgApi(botToken);
  const d = db(c.env.DB);

  // Check if user is trying to link with a code
  const codeMatch = text.match(/^([A-Z0-9]{6})$/);
  if (codeMatch) {
    const code = codeMatch[1];
    const userId = await c.env.SESSIONS.get(`tg_link:${code}`);
    if (userId) {
      // Link this chat to the user
      await d.saveTelegramUser({
        user_id: parseInt(userId),
        telegram_chat_id: chatId,
        telegram_username: tgUsername,
        daily_report_enabled: 1,
        daily_report_time: '08:00',
      });
      await c.env.SESSIONS.delete(`tg_link:${code}`);
      const user = await d.getUserById(parseInt(userId));
      await tg.sendMessage(chatId, formatTelegramMessage('welcome', { name: user?.full_name || user?.email || 'there' }));
      return c.json({ ok: true });
    }
    await tg.sendMessage(chatId, '❌ Invalid or expired code. Please generate a new one from the app.');
    return c.json({ ok: true });
  }

  // Look up user by chat ID
  const tgUser = await d.getTelegramUserByChatId(chatId);
  if (!tgUser) {
    await tg.sendMessage(chatId, '👋 Hi! To use FinPulse, open the app and go to Telegram settings to get your link code.');
    return c.json({ ok: true });
  }

  const user = await d.getUserById(tgUser.user_id);
  if (!user) return c.json({ ok: true });

  // Handle /balance, /summary commands
  if (text === '/balance' || text === '/start') {
    const accounts = await d.getAccounts(user.id);
    const lines = accounts.map(a => `${a.name}: SAR ${a.balance.toFixed(2)}`);
    const total = accounts.reduce((s, a) => s + a.balance, 0);
    lines.push(`\n💰 Total: SAR ${total.toFixed(2)}`);
    await tg.sendMessage(chatId, '🏦 *Your Balances*\n\n' + lines.join('\n'), { parse_mode: 'Markdown' });
    return c.json({ ok: true });
  }

  if (text === '/summary') {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { income, expenses } = await d.getMonthlyTotals(user.id, month);
    const net = income - expenses;
    const msg = `📊 *${month} Summary*\n\n✅ Income: SAR ${income.toFixed(2)}\n❌ Expenses: SAR ${expenses.toFixed(2)}\n${net >= 0 ? '💚' : '🔴'} Net: SAR ${net.toFixed(2)}`;
    await tg.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    return c.json({ ok: true });
  }

  if (text === '/login') {
    const code = generateLinkCode();
    await c.env.SESSIONS.put(`tg_link:${code}`, String(user.id), { expirationTtl: 600 });
    await tg.sendMessage(chatId, `🔐 *Your Login Code:*\n\`${code}\`\n\nValid for 10 minutes. Enter this code on the FinPulse login page.`, { parse_mode: 'Markdown' });
    return c.json({ ok: true });
  }

  // AI processing for natural language
  const history = await d.getChatHistory(user.id, 6);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [accounts, { income, expenses }, categorySpend] = await Promise.all([
    d.getAccounts(user.id),
    d.getMonthlyTotals(user.id, month),
    d.getCategorySpend(user.id, month),
  ]);

  const context = {
    accounts: accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })),
    monthlyIncome: income, monthlyExpenses: expenses, categorySpend,
    today: now.toISOString().split('T')[0], month,
  };

  let reply = 'Sorry, I had trouble with that.';
  try {
    const result = await processChat(c.env.GROQ_API_KEY, history, text, context);
    if (result && typeof result === 'object' && result.action) {
      reply = await executeTelegramAction(result, user, d);
    } else {
      reply = typeof result === 'string' ? result : result?.message || reply;
    }
  } catch (err) {
    console.error('TG AI error:', err);
  }

  await d.addChatMessage(user.id, 'user', text);
  await d.addChatMessage(user.id, 'assistant', reply);
  await tg.sendMessage(chatId, reply);
  return c.json({ ok: true });
});

async function executeTelegramAction(action, user, d) {
  const today = new Date().toISOString().split('T')[0];
  const budget_month = today.substring(0, 7);

  if (action.action === 'transaction') {
    const { type, amount, category, description, account_name } = action;
    if (!type || !amount) return 'I need type and amount to add a transaction.';
    const accounts = await d.getAccounts(user.id);
    let account = accounts[0];
    if (account_name) {
      const m = accounts.find(a => a.name.toLowerCase().includes(account_name.toLowerCase()));
      if (m) account = m;
    }
    if (!account) return 'No accounts found. Please add one in the app first.';
    await d.createTransaction({ user_id: user.id, type, amount: parseFloat(amount), account_id: account.id, category: category || 'Other', description: description || '', date: today, budget_month });
    const delta = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
    await d.adjustBalance(account.id, delta);
    return `✅ Added ${type} SAR ${parseFloat(amount).toFixed(2)} (${category || 'Other'}) to ${account.name}.`;
  }

  return action.message || '✅ Done!';
}

// Send daily reports to all subscribed users
export async function sendDailyReports(env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  const tg = tgApi(botToken);
  const d = db(env.DB);

  const now = new Date();
  const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { results } = await env.DB.prepare(
    `SELECT * FROM telegram_users WHERE daily_report_enabled = 1 AND daily_report_time = ?`
  ).bind(timeStr).all();

  for (const tgUser of results) {
    const { income, expenses } = await d.getMonthlyTotals(tgUser.user_id, month);
    const user = await d.getUserById(tgUser.user_id);
    const accounts = await d.getAccounts(tgUser.user_id);
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const msg = formatTelegramMessage('daily_summary', {
      name: user?.full_name || '', income, expenses, totalBalance, month
    });
    await tg.sendMessage(tgUser.telegram_chat_id, msg, { parse_mode: 'Markdown' });
  }
}
