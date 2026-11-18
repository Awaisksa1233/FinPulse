import { baseLayout, esc, fmt } from './base.js';

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
  const net = income - expenses;
  const accLen = accounts.length;

  function getCatEmoji(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('food') || c.includes('dining') || c.includes('restaurant')) return '🍔';
    if (c.includes('coffee') || c.includes('cafe')) return '☕';
    if (c.includes('grocer') || c.includes('supermarket')) return '🛒';
    if (c.includes('transport') || c.includes('uber') || c.includes('taxi') || c.includes('fuel')) return '🚕';
    if (c.includes('shop') || c.includes('clothing')) return '🛍️';
    if (c.includes('bill') || c.includes('util') || c.includes('electric')) return '💡';
    if (c.includes('salary') || c.includes('paycheck') || c.includes('income')) return '💰';
    if (c.includes('rent') || c.includes('housing')) return '🏠';
    if (c.includes('health') || c.includes('medical') || c.includes('pharm')) return '💊';
    if (c.includes('movie') || c.includes('netflix') || c.includes('entertainment') || c.includes('fun')) return '🍿';
    if (c.includes('travel') || c.includes('flight')) return '✈️';
    return '💳';
  }

  // Budget Alerts
  const alertsHtml = budgetAlerts.length ? `
    <div class="rounded-2xl p-3.5 bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border border-rose-800/60 shadow-lg text-white mb-3">
      <div class="flex items-start gap-3">
        <div class="bg-rose-500/20 p-2 rounded-xl text-rose-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="flex-1">
          <p class="font-bold text-xs uppercase tracking-wider text-rose-300 mb-1">Budget Alerts (${budgetAlerts.length})</p>
          <div class="space-y-1 text-xs opacity-95">
            ${budgetAlerts.map(a => `<div>• <strong>${esc(a.category)}</strong>: SAR <span class="privacy-val">${fmt(a.spent)}</span> / ${fmt(a.monthly_limit || a.limit)} (${Math.round((a.pct || 0) * 100)}%)</div>`).join('')}
          </div>
          <a href="/budgets" class="inline-block mt-2 text-xs text-rose-200 underline font-semibold">Manage Budgets →</a>
        </div>
      </div>
    </div>` : '';

  // Accounts Carousel (Horizontal swipeable deck)
  const accountsCarouselHtml = accounts.length ? `
    <div class="accounts-carousel-wrap mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Your Accounts (${accounts.length})</h3>
        <a href="/accounts" class="text-[11px] text-blue-400 hover:underline">Manage →</a>
      </div>
      <div class="accounts-carousel flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 snap-x snap-mandatory">
        ${accounts.map((a, i) => {
          const isBank = a.type === 'bank';
          const isMobile = a.type === 'mobile';
          const gradient = i % 3 === 0 
            ? 'from-blue-900/40 via-slate-900 to-slate-950 border-blue-700/30' 
            : i % 3 === 1 
            ? 'from-teal-900/40 via-slate-900 to-slate-950 border-teal-700/30'
            : 'from-purple-900/40 via-slate-900 to-slate-950 border-purple-700/30';
          const dotColor = i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-teal-400' : 'bg-purple-400';
          return `
          <a href="/accounts" class="snap-start flex-shrink-0 w-[230px] p-4 rounded-2xl bg-gradient-to-br ${gradient} border relative overflow-hidden shadow active:scale-[0.98] transition-transform block">
            <div class="flex items-center justify-between text-xs mb-3">
              <span class="font-medium text-slate-200 flex items-center gap-1.5 truncate">
                <span class="w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></span> ${esc(a.name)}
              </span>
              <span class="text-[9px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/40">${esc(a.type)}</span>
            </div>
            <p class="text-[10px] text-slate-400">Available Balance</p>
            <p class="text-lg font-bold font-mono text-white tracking-tight">
              SAR <span class="privacy-val">${fmt(a.balance)}</span>
            </p>
            <div class="mt-2 pt-2 border-t border-slate-800/50 flex justify-between text-[10px] text-slate-400">
              <span>${isBank ? 'Bank Account' : isMobile ? 'Digital Wallet' : 'Cash Reserve'}</span>
              <span class="text-emerald-400">Active</span>
            </div>
          </a>`;
        }).join('')}
      </div>
    </div>` : `
    <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 mb-4">
      <p class="mb-2">No accounts added yet.</p>
      <a href="/accounts" class="inline-block px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold">Add Account</a>
    </div>`;

  // Budget Progress Calculation
  const totalBudgetLimit = budgetProgress.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const budgetPct = totalBudgetLimit > 0 ? Math.min(Math.round((expenses / totalBudgetLimit) * 100), 100) : 0;
  const budgetRemaining = Math.max(totalBudgetLimit - expenses, 0);

  // Recent Activity Feed
  const recentHtml = recentTransactions.length ? recentTransactions.map(t => {
    const isInc = t.type === 'income';
    const isExp = t.type === 'expense';
    const catEmoji = getCatEmoji(t.category);
    return `
    <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 active:scale-[0.99] transition-transform">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-lg shadow-inner">
          ${catEmoji}
        </div>
        <div>
          <h4 class="text-xs font-semibold text-slate-200 leading-tight">${esc(t.category)}</h4>
          <p class="text-[10px] text-slate-400">${esc(t.date)}${t.account_name ? ' • ' + esc(t.account_name) : ''}</p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-xs font-bold font-mono ${isInc ? 'text-emerald-400' : 'text-rose-400'}">
          ${isInc ? '+' : isExp ? '-' : ''}SAR <span class="privacy-val">${fmt(t.amount)}</span>
        </span>
        <p class="text-[9px] text-slate-500">${esc(t.description || t.type)}</p>
      </div>
    </div>`;
  }).join('') : `
    <div class="text-center py-8 text-slate-500 text-xs">
      <p class="mb-2">No transactions logged yet.</p>
      <button onclick="openQuickAddSheet('expense')" class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 font-semibold">Log your first expense</button>
    </div>`;

  const content = `
    <div class="space-y-4">

      <!-- Total Net Worth Hero Card -->
      <div class="rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-slate-800/80 shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span class="uppercase tracking-wider font-semibold text-[10px]">Total Net Worth</span>
          <span class="text-emerald-400 font-medium flex items-center gap-1 text-[11px] bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
            ${accLen} active accounts
          </span>
        </div>

        <div class="flex items-baseline gap-2 mb-3">
          <span class="text-3xl font-extrabold tracking-tight text-white font-mono">
            SAR <span class="privacy-val">${fmt(totalBalance)}</span>
          </span>
        </div>

        <div class="hero-stats-grid grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Monthly In</p>
              <p class="font-semibold text-slate-200 font-mono">+SAR <span class="privacy-val">${fmt(income)}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Monthly Out</p>
              <p class="font-semibold text-slate-200 font-mono">-SAR <span class="privacy-val">${fmt(expenses)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcut Pills (Thumb zone) -->
      <div class="thumb-actions-grid grid grid-cols-4 gap-2">
        <button onclick="openQuickAddSheet('expense')" class="thumb-action-card flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-inner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Expense</span>
        </button>

        <button onclick="openQuickAddSheet('income')" class="thumb-action-card flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m-8-8h16"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Income</span>
        </button>

        <a href="/chat" class="thumb-action-card flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">AI Advisor</span>
        </a>

        <a href="/budgets" class="thumb-action-card flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 active:scale-95 transition-all">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </div>
          <span class="text-[11px] font-medium text-slate-300">Budgets</span>
        </a>
      </div>

      <!-- Horizontal Swipeable Accounts Carousel -->
      ${accountsCarouselHtml}

      <!-- Monthly Budget Health Bar -->
      <div class="rounded-2xl p-3.5 bg-slate-900 border border-slate-800 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-slate-200">Monthly Budget Health</span>
          <span class="text-[11px] text-slate-400 font-mono">${budgetPct}% used</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden relative">
          <div class="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-2.5 rounded-full" style="width:${budgetPct}%;"></div>
        </div>
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>SAR <span class="privacy-val">${fmt(expenses)}</span> spent</span>
          <span class="text-emerald-400 font-medium">SAR <span class="privacy-val">${fmt(budgetRemaining)}</span> remaining</span>
        </div>
      </div>

      ${alertsHtml}

      <!-- AI Financial Insights Card -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">⚡</div>
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Financial Snapshot</span>
          </div>
          <button onclick="refreshSummary()" id="refreshSummaryBtn" class="text-[11px] text-blue-400 hover:text-blue-300">Refresh</button>
        </div>
        <div id="aiSummary" class="text-xs text-slate-300 leading-relaxed">
          <div class="animate-pulse space-y-1.5 py-1">
            <div class="h-2.5 bg-slate-800 rounded w-full"></div>
            <div class="h-2.5 bg-slate-800 rounded w-4/5"></div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Feed -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Transactions</h3>
          <a href="/expenses" class="text-[11px] text-blue-400 hover:underline">View All</a>
        </div>
        <div id="homeTxList" class="space-y-2">
          ${recentHtml}
        </div>
      </div>

    </div>
  `;

  const scripts = `
  <script>
    async function loadAISummary() {
      try {
        const res = await fetch('/api/summary');
        if (!res.ok) return;
        const data = await res.json();
        const el = document.getElementById('aiSummary');
        if (el && data.summary) {
          el.innerHTML = '<p>' + esc(data.summary).replace(/\\n/g, '<br>') + '</p>';
        }
      } catch (e) {}
    }

    async function refreshSummary() {
      const el = document.getElementById('aiSummary');
      const btn = document.getElementById('refreshSummaryBtn');
      if (el) el.innerHTML = '<div class="animate-pulse space-y-1.5 py-1"><div class="h-2.5 bg-slate-800 rounded w-full"></div><div class="h-2.5 bg-slate-800 rounded w-4/5"></div></div>';
      if (btn) btn.textContent = 'Analyzing...';
      await loadAISummary();
      if (btn) btn.textContent = 'Refresh';
    }

    document.addEventListener('DOMContentLoaded', loadAISummary);
  </script>`;

  return baseLayout({
    title: 'Dashboard',
    activePage: 'dashboard',
    content,
    scripts,
    user,
    flash,
  });
}
