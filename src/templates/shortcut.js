// src/templates/shortcut.js
import { baseLayout } from './base.js';

export function shortcutPage({ user, serverUrl = '', flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">Apple Shortcuts & Quick Add</h2>
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <p>Integrate iOS Siri Shortcuts to log expenses by voice or lockscreen widget directly to FinPulse in SAR.</p>
        <p class="font-mono text-blue-400">Endpoint: ${serverUrl}/api/transaction</p>
      </div>
    </div>
  `;
  return baseLayout({ title: 'Shortcuts', activePage: 'settings', content, user, flash });
}
