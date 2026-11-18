// src/templates/settings.js
import { baseLayout } from './base.js';

export function settingsPage({ user, flash = [] }) {
  const content = `
    <div class="space-y-4">
      <div class="flex items-center justify-between pt-1">
        <h2 class="text-base font-bold text-white">Settings & Preferences</h2>
      </div>

      <form method="POST" action="/settings" class="space-y-3">
        <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input type="text" name="full_name" value="${user?.full_name || ''}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">KSA Salary Rollover Day</label>
            <input type="number" min="1" max="31" name="salary_day" value="${user?.salary_day || 28}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
            <span class="text-[10px] text-slate-500 mt-0.5 block">Budget cycles reset on this day each month (default 28 for KSA).</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
            <input type="text" readonly value="SAR (Saudi Riyal)" class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
          </div>
        </div>

        <button type="submit" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">
          Save Settings
        </button>
      </form>

      <div class="pt-2">
        <a href="/logout" class="block w-full py-3 text-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition">
          Log Out
        </a>
      </div>
    </div>
  `;

  return baseLayout({
    title: 'Settings',
    activePage: 'settings',
    content,
    user,
    flash
  });
}
