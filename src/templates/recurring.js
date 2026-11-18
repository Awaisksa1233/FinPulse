// src/templates/recurring.js
import { baseLayout } from './base.js';

export function recurringPage({ user, templates = [], flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">Recurring Subscriptions</h2>
      <div class="space-y-2">
        ${templates.length > 0 ? templates.map(t => `
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <div>
              <h4 class="text-xs font-bold text-white">${t.description || t.category}</h4>
              <p class="text-[10px] text-slate-400">Day ${t.day_of_month} of month</p>
            </div>
            <span class="text-xs font-mono text-rose-400 privacy-val">SAR ${t.amount}</span>
          </div>
        `).join('') : '<p class="text-xs text-slate-500 text-center py-4">No recurring bills.</p>'}
      </div>
    </div>
  `;
  return baseLayout({ title: 'Recurring', activePage: 'dashboard', content, user, flash });
}
