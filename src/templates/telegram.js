// src/templates/telegram.js
import { baseLayout } from './base.js';

export function telegramPage({ user, flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">Telegram Bot Sync</h2>
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <p>Sync your transactions instantly on the go via Telegram bot.</p>
        <p class="font-mono text-emerald-400">Telegram: ${user?.telegram_chat_id ? 'Connected' : 'Not linked'}</p>
      </div>
    </div>
  `;
  return baseLayout({ title: 'Telegram', activePage: 'settings', content, user, flash });
}
