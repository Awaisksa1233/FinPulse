// src/templates/transactions.js
import { baseLayout } from './base.js';

export function transactionsPage({ user, transactionType = 'expense', accounts = [], transactions = [], flash = [] }) {
  const isExp = transactionType === 'expense';
  const content = `
    <div class="space-y-3">
      <div class="flex items-center justify-between pt-1">
        <h2 class="text-base font-bold text-white">Activity</h2>
        <span class="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">${transactions.length} total</span>
      </div>

      <!-- Filter Chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <a href="/expenses" class="px-3 py-1.5 rounded-full ${isExp ? 'bg-rose-600 text-white font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300'} flex-shrink-0">Expenses</a>
        <a href="/income" class="px-3 py-1.5 rounded-full ${!isExp ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300'} flex-shrink-0">Income</a>
      </div>

      <!-- Transaction List -->
      <div class="space-y-2 mt-2">
        ${transactions.length > 0 ? transactions.map(t => {
          const cat = t.category || 'Other';
          const emoji = cat.includes('Food') || cat.includes('Dining') ? '🍔' : cat.includes('Transport') ? '🚕' : cat.includes('Shopping') ? '🛍️' : cat.includes('Groceries') ? '🛒' : isExp ? '💸' : '💰';
          return `
            <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center text-lg">${emoji}</div>
                <div>
                  <h4 class="text-xs font-semibold text-slate-200">${t.description || t.category}</h4>
                  <p class="text-[10px] text-slate-400">${t.date} • ${t.account_name || 'Account'}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold font-mono ${isExp ? 'text-rose-400' : 'text-emerald-400'} privacy-val">
                  ${isExp ? '-' : '+'}SAR ${t.amount.toFixed(2)}
                </span>
                <form method="POST" action="/transaction/${t.id}/delete" class="inline" onsubmit="return confirm('Delete transaction?')">
                  <button type="submit" class="block text-[9px] text-slate-500 hover:text-rose-400 mt-0.5 ml-auto">Delete</button>
                </form>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="p-6 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            No transactions found.
          </div>
        `}
      </div>
    </div>
  `;

  return baseLayout({
    title: isExp ? 'Expenses' : 'Income',
    activePage: 'transactions',
    content,
    user,
    flash
  });
}
