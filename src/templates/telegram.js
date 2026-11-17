import { baseLayout, esc } from './base.js';

export function telegramPage({ user, tgUser, linkCode, flash = [] }) {
  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Telegram Bot Integration</h2>
        <p class="page-subtitle">Log transactions on the go and receive scheduled daily summaries right in Telegram.</p>
      </div>
    </header>

    <div class="content-wrapper" style="padding-top:0;max-width:800px;">
      ${tgUser ? `
      <!-- Connected State Card -->
      <div class="card card-accent-blue" style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#2AABEE 0%,#229ED9 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(34,158,217,.35);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h3 style="font-size:17px;font-weight:700;margin:0;color:var(--text);">Telegram Connected</h3>
                <span class="badge badge-success">Active</span>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0;">
                ${esc(tgUser.telegram_username ? '@' + tgUser.telegram_username : 'Chat ID: ' + tgUser.telegram_chat_id)}
              </p>
            </div>
          </div>

          <form method="POST" action="/telegram/disconnect" onsubmit="return confirm('Disconnect your Telegram account?')" style="margin:0;">
            <button type="submit" class="btn btn-outline btn-sm" style="color:var(--red-600);border-color:rgba(220,38,38,.2);">
              Disconnect
            </button>
          </form>
        </div>

        <div style="background:var(--slate-50);border-radius:var(--r);padding:16px 20px;margin-bottom:20px;">
          <h4 style="font-size:13px;font-weight:700;color:var(--text);margin:0 0 10px;text-transform:uppercase;letter-spacing:.5px;">
            Supported Bot Commands
          </h4>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-muted);line-height:1.9;">
            <li><code>/add 150 food lunch today</code> — Quickly log an expense</li>
            <li><code>/income 5000 salary</code> — Record deposit or earnings</li>
            <li><code>/balance</code> — View current account totals</li>
            <li><code>/summary</code> — Get a snapshot of this month's budget</li>
            <li>Or write naturally (e.g. <em>"paid 45 SAR for fuel"</em>) — AI handles the rest!</li>
          </ul>
        </div>

        <!-- Daily Report Preferences -->
        <div class="divider"></div>
        <h4 style="font-size:14px;font-weight:700;color:var(--text);margin:16px 0 12px;">Daily Scheduled Report</h4>
        <form method="POST" action="/telegram/settings" style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;">
          <div>
            <label class="form-label">Delivery Time</label>
            <input type="time" name="report_time" value="${esc(tgUser.daily_report_time || '08:00')}" class="form-control" style="width:140px;">
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px;">
            <input type="checkbox" name="daily_report_enabled" id="drenable" value="1" ${tgUser.daily_report_enabled ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--blue-600);cursor:pointer;">
            <label for="drenable" style="font-size:13.5px;color:var(--text);font-weight:500;cursor:pointer;">Send automatic daily financial morning brief</label>
          </div>
          <button type="submit" class="btn btn-primary" style="margin-left:auto;">Save Settings</button>
        </form>
      </div>` : `
      <!-- Not Connected State Card -->
      <div class="card" style="text-align:center;padding:48px 24px;margin-bottom:24px;">
        <div style="width:68px;height:68px;border-radius:20px;background:linear-gradient(135deg,#2AABEE 0%,#229ED9 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 12px 32px rgba(34,158,217,.35);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        </div>
        <h3 style="font-size:20px;font-weight:800;color:var(--text);margin:0 0 8px;">Connect FinPulse Bot</h3>
        <p style="color:var(--text-muted);margin:0 auto 24px;font-size:14px;max-width:440px;line-height:1.6;">
          Link your Telegram to log expenses with conversational ease and receive daily smart financial insights.
        </p>

        ${linkCode ? `
        <div style="background:var(--slate-50);border:1.5px dashed var(--border);border-radius:var(--r-lg);padding:24px;margin-bottom:24px;max-width:400px;margin-left:auto;margin-right:auto;">
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 8px;">1. Open the bot in Telegram:</p>
          <a href="https://t.me/FinPulseBot" target="_blank" class="btn btn-outline btn-sm" style="margin-bottom:16px;">
            Open @FinPulseBot ↗
          </a>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 8px;">2. Send this 6-digit code to the bot:</p>
          <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:var(--blue-600);font-family:monospace;padding:10px 0;">
            ${esc(linkCode)}
          </div>
          <p style="font-size:11.5px;color:var(--text-light);margin:4px 0 0;">Code expires in 10 minutes.</p>
        </div>
        <form method="POST" action="/telegram/generate-code">
          <button type="submit" class="btn btn-ghost btn-sm">Regenerate Link Code</button>
        </form>
        ` : `
        <form method="POST" action="/telegram/generate-code">
          <button type="submit" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Generate Connection Code
          </button>
        </form>
        `}
      </div>
      `}
    </div>`;

  return baseLayout({
    title: 'Telegram Bot',
    activePage: 'telegram',
    content,
    user,
    flash
  });
}
