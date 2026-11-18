// src/templates/budgets.js
import { baseLayout } from './base.js';

export function budgetsPage({ user, budgets = [], spendingMap = {}, flash = [] }) {
  const content = `
    <div class="space-y-4">
      <div class="flex items-center justify-between pt-1">
        <h2 class="text-base font-bold text-white">Budgets & Insights</h2>
        <span class="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">Day 28 Cycle</span>
      </div>

      <!-- Budget Meters -->
      <div class="space-y-2.5">
        ${budgets.length > 0 ? budgets.map(b => {
          const spent = spendingMap[b.category] || 0;
          const pct = b.monthly_limit > 0 ? Math.min(Math.round((spent / b.monthly_limit) * 100), 100) : 0;
          const isOver = spent > b.monthly_limit;
          return `
            <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="font-semibold text-slate-200">${b.category}</span>
                <span class="font-mono ${isOver ? 'text-rose-400 font-bold' : 'text-slate-400'} privacy-val">SAR ${spent} / ${b.monthly_limit}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div class="${isOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'} h-2 rounded-full" style="width: ${pct}%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-500">
                <span>${pct}% spent</span>
                <span>${isOver ? 'Exceeded by SAR ' + (spent - b.monthly_limit).toFixed(2) : 'SAR ' + (b.monthly_limit - spent).toFixed(2) + ' left'}</span>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="p-6 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            No budgets configured. Add one below!
          </div>
        `}
      </div>

      <!-- Add Budget Form -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-xs font-bold text-slate-200">Set Category Budget</h3>
        <form method="POST" action="/budget" class="space-y-2.5">
          <input type="text" name="category" required placeholder="Category (e.g. Dining)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          <input type="number" step="0.01" name="monthly_limit" required placeholder="Monthly Limit (SAR)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">Save Budget</button>
        </form>
      </div>
    </div>
  `;

  return baseLayout({
    title: 'Budgets',
    activePage: 'budgets',
    content,
    user,
    flash
  });
}
