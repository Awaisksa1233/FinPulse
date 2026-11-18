// src/templates/dashboard.js
import { baseLayout } from './base.js';

export function dashboardPage({
  user,
  accounts = [],
  income = 0,
  expenses = 0,
  totalBalance = 0,
  recentTransactions = [],
  budgetAlerts = [],
  budgetProgress = [],
  categorySpend = {},
  flash = []
}) {
  const content = `
    <div class="space-y-4">
      <!-- Total Net Worth Hero Card -->
      <div class="rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span class="uppercase tracking-wider font-semibold text-[10px]">Total Net Worth</span>
          <span class="text-emerald-400 font-medium flex items-center gap-1 text-[11px] bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            KSA Cycle
          </span>
        </div>

        <div class="flex items-baseline gap-2 mb-3">
          <span class="text-xs text-slate-400 font-bold">SAR</span>
          <span class="text-3xl font-extrabold tracking-tight text-white font-mono privacy-val">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <!-- Monthly cashflow -->
        <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">↓</div>
            <div>
              <p class="text-[10px] text-slate-400">Monthly In</p>
              <p class="font-semibold text-slate-200 font-mono privacy-val">+SAR ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">↑</div>
            <div>
              <p class="text-[10px] text-slate-400">Monthly Out</p>
              <p class="font-semibold text-slate-200 font-mono privacy-val">-SAR ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4-Thumb Action Buttons -->
      <div class="thumb-actions-grid grid grid-cols-4 gap-2">
        <button onclick="openQuickAddSheet('expense')" class="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Expense</span>
        </button>

        <button onclick="openQuickAddSheet('income')" class="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m-8-8h16"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Income</span>
        </button>

        <a href="/chat" class="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">AI Pulse</span>
        </a>

        <a href="/budgets" class="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Budgets</span>
        </a>
      </div>

      <!-- Accounts Horizontal Carousel -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Your Accounts</h3>
          <a href="/accounts" class="text-[11px] text-blue-400 hover:underline">Manage</a>
        </div>

        <div class="accounts-carousel flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x snap-mandatory">
          ${accounts.map(acc => `
            <div class="snap-start flex-shrink-0 w-[220px] p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-950 border border-slate-800 shadow relative">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="font-medium text-blue-300">${acc.name}</span>
                <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${acc.type}</span>
              </div>
              <p class="text-[10px] text-slate-400">Balance</p>
              <p class="text-base font-bold font-mono text-white privacy-val">SAR ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Budget Progress Alerts -->
      ${budgetProgress.length > 0 ? `
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-200">Budget Tracking (Day 28 Cycle)</span>
          <span class="text-[10px] text-slate-400">${budgetProgress.length} active</span>
        </div>
        ${budgetProgress.map(b => `
          <div class="space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-300 font-medium">${b.category}</span>
              <span class="font-mono ${b.status === 'exceeded' ? 'text-rose-400 font-bold' : b.status === 'warning' ? 'text-amber-400' : 'text-slate-400'} privacy-val">
                SAR ${b.spent} / ${b.monthly_limit} (${b.progress_pct}%)
              </span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="${b.status === 'exceeded' ? 'bg-rose-500' : b.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'} h-full rounded-full" style="width: ${b.progress_pct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Recent Transactions Feed -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Transactions</h3>
          <a href="/expenses" class="text-[11px] text-blue-400 hover:underline">View All</a>
        </div>

        <div class="space-y-2">
          ${recentTransactions.length > 0 ? recentTransactions.map(tx => {
            const isExp = tx.type === 'expense';
            const catEmoji = tx.category.includes('Food') || tx.category.includes('Dining') ? '🍔' : tx.category.includes('Groceries') ? '🛒' : tx.category.includes('Transport') ? '🚕' : tx.category.includes('Shopping') ? '🛍️' : isExp ? '💸' : '💰';
            return `
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center text-lg">
                    ${catEmoji}
                  </div>
                  <div>
                    <h4 class="text-xs font-semibold text-slate-200 leading-tight">${tx.description || tx.category}</h4>
                    <p class="text-[10px] text-slate-400">${tx.date} • ${tx.account_name || 'Account'}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold font-mono ${isExp ? 'text-rose-400' : 'text-emerald-400'} privacy-val">
                    ${isExp ? '-' : '+'}SAR ${tx.amount.toFixed(2)}
                  </span>
                  <p class="text-[9px] text-slate-500">${tx.category}</p>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="p-6 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
              No transactions logged yet. Tap (+) to add one!
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  return baseLayout({
    title: 'Dashboard',
    activePage: 'dashboard',
    content,
    user,
    flash
  });
}
