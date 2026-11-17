import { Hono } from 'hono';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { transactionsRouter } from './routes/transactions.js';
import { accountsRouter } from './routes/accounts.js';
import { budgetsRouter } from './routes/budgets.js';
import { recurringRouter } from './routes/recurring.js';
import { loansRouter } from './routes/loans.js';
import { chatRouter } from './routes/chat.js';
import { reportsRouter } from './routes/reports.js';
import { telegramRouter } from './routes/telegram.js';
import { adminRouter } from './routes/admin.js';
import { processRecurringTemplates } from './routes/recurring.js';
import { sendDailyReports } from './routes/telegram.js';
import { shortcutPage } from './templates/shortcut.js';
import { getSession } from './auth.js';
import { db } from './db.js';

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);
const app = new Hono();

// ── Static assets ──────────────────────────────────────────────────
app.get('/static/*', async (c) => {
  try {
    return await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: (req) => {
          const url = new URL(req.url);
          url.pathname = url.pathname.replace(/^\/static/, '');
          return new Request(url.toString(), req);
        },
      }
    );
  } catch (e) {
    return c.notFound();
  }
});

// ── Auth routes ─────────────────────────────────────────────────────
app.route('/', authRouter);

// ── App routes ──────────────────────────────────────────────────────
app.route('/', dashboardRouter);
app.route('/', transactionsRouter);
app.route('/', accountsRouter);
app.route('/', budgetsRouter);
app.route('/', recurringRouter);
app.route('/', loansRouter);
app.route('/', chatRouter);
app.route('/', reportsRouter);
app.route('/', telegramRouter);
app.route('/', adminRouter);

// ── Root static shortcuts ──────────────────────────────────────────
app.get('/manifest.json', (c) => c.redirect('/static/manifest.json'));
app.get('/sw.js', (c) => c.redirect('/static/sw.js'));
app.get('/favicon.ico', (c) => c.redirect('/static/icons/icon-192.png'));

// ── Shortcut guide ──────────────────────────────────────────────────
app.get('/shortcut', async (c) => {
  const session = await getSession(c);
  if (!session) return c.redirect('/login');
  const user = await db(c.env.DB).getUserById(session.userId);
  if (!user) return c.redirect('/login');
  const url = new URL(c.req.url);
  return c.html(shortcutPage({ user, serverUrl: url.origin, flash: [] }));
});

// ── 404 handler ─────────────────────────────────────────────────────
app.notFound((c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>404 – FinPulse</title>
<style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;}
h1{font-size:48px;margin:0;}p{color:#64748b;}a{color:#6366f1;}</style></head>
<body><h1>404</h1><p>Page not found.</p><a href="/">← Back to FinPulse</a></body></html>`, 404);
});

// ── Error handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('App error:', err);
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Error – FinPulse</title>
<style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;}
h1{font-size:32px;margin:0;}p{color:#64748b;}a{color:#6366f1;}</style></head>
<body><h1>Something went wrong</h1><p>Please try again or <a href="/">go home</a>.</p></body></html>`, 500);
});

// ── Cloudflare Workers export ────────────────────────────────────────
export default {
  fetch: app.fetch,

  // Scheduled task handler (Cloudflare Cron Triggers)
  async scheduled(event, env, ctx) {
    switch (event.cron) {
      // Every minute — check for recurring templates due today
      case '0 0 * * *':
        ctx.waitUntil(processRecurringTemplates(env));
        break;

      // Every hour — send daily reports to users whose report time matches
      case '0 * * * *':
        ctx.waitUntil(sendDailyReports(env));
        break;
    }
  },
};
