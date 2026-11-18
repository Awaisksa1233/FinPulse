// src/templates/reports.js
import { baseLayout } from './base.js';

export function reportsPage({ user, month, totals = { income: 0, expenses: 0 }, categorySpend = {}, flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">Monthly Analytics</h2>
      <div class="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div class="flex justify-between text-xs">
          <span class="text-slate-400">Month</span>
          <span class="font-mono text-white">${month || 'Current'}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-slate-400">Total Income</span>
          <span class="font-mono text-emerald-400 font-bold privacy-val">+SAR ${(totals.income || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-slate-400">Total Expenses</span>
          <span class="font-mono text-rose-400 font-bold privacy-val">-SAR ${(totals.expenses || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
  return baseLayout({ title: 'Analytics', activePage: 'budgets', content, user, flash });
}
