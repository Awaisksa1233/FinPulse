import { baseLayout, esc } from './base.js';

export function telegramPage({ user, tgUser, linkCode, flash }) {
  const content = `
    <header class="page-header" style="margin-bottom:24px;">
      <h2 class="page-title">Telegram Bot</h2>
      <p class="page-subtitle">Connect your Telegram account to log transactions and get daily reports.</p>
    </header>

    ${tgUser ? `
    <!-- Connected State -->
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#2AABEE,#229ED9);display:flex;align-items:center;justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        </div>
        <div>
          <p style="font-weight:700;font-size:16px;margin:0;">Connected ✓</p>
          <p style="font-size:14px;color:var(--gray-500);margin:0;">${esc(tgUser.telegram_username ? '@' + tgUser.telegram_username : 'Telegram user')} · Chat ID: ${esc(String(tgUser.telegram_chat_id))}</p>
        </div>
      </div>
      <div style="background:var(--gray-50);border-radius:8px;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 10px;font-size:14px;font-weight:600;">What you can do:</h4>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:var(--gray-700);line-height:1.8;">
          <li>Send <code>/add 150 groceries today</code> to log an expense</li>
          <li>Send <code>/income 5000 salary</code> to log income</li>
          <li>Send <code>/balance</code> to see your accounts</li>
          <li>Send <code>/summary</code> for this month's report</li>
          <li>Or just chat naturally — the AI understands your intent</li>
        </ul>
      </div>
      <form method="POST" action="/telegram/disconnect" onsubmit="return confirm('Disconnect Telegram?')">
        <button type="submit" class="btn" style="background:var(--gray-100);color:var(--gray-700);font-size:13px;">Disconnect</button>
      </form>
    </div>

    <!-- Daily Report Settings -->
    <div class="card">
      <h3 style="margin:0 0 16px;font-size:16px;">Daily Report</h3>
      <form method="POST" action="/telegram/settings" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <label class="form-label">Send at (24h)</label>
          <input type="time" name="report_time" value="${esc(tgUser.daily_report_time || '08:00')}" class="form-control" style="width:120px;">
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding-bottom:4px;">
          <input type="checkbox" name="daily_report_enabled" id="drenable" value="1" ${tgUser.daily_report_enabled ? 'checked' : ''} style="width:18px;height:18px;">
          <label for="drenable" style="font-size:14px;">Enable daily report</label>
        </div>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </div>

    ` : `
    <!-- Not Connected State -->
    <div class="card" style="text-align:center;padding:40px 24px;margin-bottom:24px;">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#2AABEE,#229ED9);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </div>
      <h3 style="margin:0 0 8px;font-size:18px;">Connect Telegram</h3>
      <p style="color:var(--gray-500);margin:0 0 24px;font-size:14px;">Log expenses and get reports directly in Telegram.</p>

      ${linkCode ? `
      <div style="background:var(--gray-50);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="font-size:13px;color:var(--gray-600);margin:0 0 12px;">1. Open the bot: <a href="https://t.me/FinPulseBot" target="_blank" style="color:var(--primary);">@FinPulseBot</a></p>
        <p style="font-size:13px;color:var(--gray-600);margin:0 0 12px;">2. Send this code to the bot:</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:8px;color:var(--primary);font-family:monospace;margin:0 0 12px;">${esc(linkCode)}</div>
        <p style="font-size:12px;color:var(--gray-400);margin:0;">This code expires in 10 minutes.</p>
      </div>
      <form method="POST" action="/telegram/generate-code">
        <button type="submit" class="btn btn-ghost" style="font-size:13px;">Generate new code</button>
      </form>
      ` : `
      <form method="POST" action="/telegram/generate-code">
        <button type="submit" class="btn btn-primary">Generate Link Code</button>
      </form>
      `}
    </div>
    `}`;

  return baseLayout({ title: 'Telegram', activePage: 'telegram', content, user, flash });
}
