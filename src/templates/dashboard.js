// FinPulse — Modern Mobile Dashboard
// Rebuilt clean from scratch matching the fintech prototype

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
    <div style="padding: 14px; border-radius: 20px; background: rgba(136, 19, 55, 0.4); border: 1px solid rgba(244, 63, 94, 0.4); margin-bottom: 14px;">
      <div class="flex items-start gap-3">
        <div style="padding: 8px; border-radius: 12px; background: rgba(244, 63, 94, 0.2); color: #fb7185;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="flex-1">
          <p style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #fb7185; margin-bottom: 4px;">Budget Alerts (${budgetAlerts.length})</p>
          <div class="space-y-1" style="font-size: 12px; color: #fecdd3;">
            ${budgetAlerts.map(a => `<div>• <strong>${esc(a.category)}</strong>: SAR <span class="privacy-val">${fmt(a.spent)}</span> / ${fmt(a.monthly_limit || a.limit)} (${Math.round((a.pct || 0) * 100)}%)</div>`).join('')}
          </div>
          <a href="/budgets" style="display: inline-block; margin-top: 8px; font-size: 11.5px; color: #fda4af; text-decoration: underline; font-weight: 600;">Manage Budgets →</a>
        </div>
      </div>
    </div>` : '';

  // Accounts Carousel (Horizontal swipeable deck)
  const accountsCarouselHtml = accounts.length ? `
    <div style="margin-bottom: 16px;">
      <div class="flex items-center justify-between" style="margin-bottom: 8px;">
        <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Your Accounts (${accounts.length})</h3>
        <a href="/accounts" style="font-size: 11px; color: var(--primary); font-weight: 600;">Manage →</a>
      </div>
      <div class="accounts-carousel no-scrollbar">
        ${accounts.map((a, i) => {
          const isBank = a.type === 'bank';
          const isMobile = a.type === 'mobile';
          const gradient = i % 3 === 0 
            ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), #0f172a 60%, #090d16)' 
            : i % 3 === 1 
            ? 'linear-gradient(135deg, rgba(19, 78, 74, 0.4), #0f172a 60%, #090d16)'
            : 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), #0f172a 60%, #090d16)';
          const dotColor = i % 3 === 0 ? '#60a5fa' : i % 3 === 1 ? '#2dd4bf' : '#c084fc';
          return `
          <a href="/accounts" class="account-card-deck" style="background: ${gradient};">
            <div class="flex items-center justify-between" style="margin-bottom: 12px; font-size: 12px;">
              <span style="font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px;" class="truncate">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; flex-shrink: 0;"></span> ${esc(a.name)}
              </span>
              <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); background: rgba(30, 41, 59, 0.8); padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.08);">${esc(a.type)}</span>
            </div>
            <p style="font-size: 10px; color: var(--text-muted);">Available Balance</p>
            <p style="font-size: 18px; font-weight: 800; font-family: ui-monospace, monospace; color: #ffffff; letter-spacing: -0.5px;">
              SAR <span class="privacy-val">${fmt(a.balance)}</span>
            </p>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted);">
              <span>${isBank ? 'Bank Account' : isMobile ? 'Digital Wallet' : 'Cash Reserve'}</span>
              <span style="color: #34d399; font-weight: 600;">Active</span>
            </div>
          </a>`;
        }).join('')}
      </div>
    </div>` : `
    <div style="padding: 16px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
      <p style="margin-bottom: 8px;">No accounts added yet.</p>
      <a href="/accounts" class="btn btn-primary btn-sm">Add Account</a>
    </div>`;

  // Budget Progress Calculation
  const totalBudgetLimit = budgetProgress.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const budgetPct = totalBudgetLimit > 0 ? Math.min(Math.round((expenses / totalBudgetLimit) * 100), 100) : 0;
  const budgetRemaining = Math.max(totalBudgetLimit - expenses, 0);

  // Recent Activity Feed
  const recentHtml = recentTransactions.length ? recentTransactions.map(t => {
    const isInc = t.type === 'income';
    const emoji = getCatEmoji(t.category);
    return `
    <div class="transaction-item">
      <div class="flex items-center gap-3">
        <div class="tx-icon-pill" style="background: ${isInc ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)'};">
          ${emoji}
        </div>
        <div>
          <h4 style="font-size: 12.5px; font-weight: 600; color: #f8fafc; line-height: 1.2;">${esc(t.description || t.category || 'Transaction')}</h4>
          <p style="font-size: 10.5px; color: var(--text-muted);">${esc(t.category)} • ${esc(t.date || '')}</p>
        </div>
      </div>
      <div class="text-right">
        <span style="font-size: 13px; font-weight: 700; font-family: ui-monospace, monospace; color: ${isInc ? '#34d399' : '#fb7185'};">
          ${isInc ? '+' : '-'}SAR <span class="privacy-val">${fmt(t.amount)}</span>
        </span>
        <p style="font-size: 9.5px; color: var(--text-dim);">${esc(t.account_name || 'Account')}</p>
      </div>
    </div>`;
  }).join('') : `
    <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 12px;">
      <p style="margin-bottom: 8px;">No transactions logged yet.</p>
      <button onclick="openQuickAddSheet('expense')" class="btn btn-outline btn-sm">Log your first expense</button>
    </div>`;

  const content = `
    <div class="space-y-4">

      <!-- Total Net Worth Hero Card -->
      <div class="hero-networth-card">
        <div class="flex items-center justify-between" style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
          <span style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; font-size: 10px;">Total Net Worth</span>
          <span style="color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 4px; font-size: 11px; background: rgba(6, 78, 59, 0.6); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 9999px;">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
            ${accLen} active accounts
          </span>
        </div>

        <div class="flex items-baseline gap-2" style="margin-bottom: 8px;">
          <span style="font-size: 32px; font-weight: 800; font-family: ui-monospace, monospace; color: #ffffff; letter-spacing: -0.5px;">
            SAR <span class="privacy-val">${fmt(totalBalance)}</span>
          </span>
        </div>

        <div class="hero-stats-grid">
          <div class="flex items-center gap-2">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(16, 185, 129, 0.15); color: #34d399; display: flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div>
              <p style="font-size: 10px; color: var(--text-muted);">Monthly In</p>
              <p style="font-weight: 600; font-size: 12px; color: #f1f5f9; font-family: ui-monospace, monospace;">+SAR <span class="privacy-val">${fmt(income)}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(244, 63, 94, 0.15); color: #fb7185; display: flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </div>
            <div>
              <p style="font-size: 10px; color: var(--text-muted);">Monthly Out</p>
              <p style="font-weight: 600; font-size: 12px; color: #f1f5f9; font-family: ui-monospace, monospace;">-SAR <span class="privacy-val">${fmt(expenses)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcut Pills (4-Column Thumb Zone) -->
      <div class="thumb-actions-grid">
        <button onclick="openQuickAddSheet('expense')" class="thumb-action-card">
          <div class="thumb-action-icon" style="background: rgba(244, 63, 94, 0.15); color: #fb7185;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #cbd5e1;">Expense</span>
        </button>

        <button onclick="openQuickAddSheet('income')" class="thumb-action-card">
          <div class="thumb-action-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m-8-8h16"/></svg>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #cbd5e1;">Income</span>
        </button>

        <a href="/chat" class="thumb-action-card">
          <div class="thumb-action-icon" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #cbd5e1;">AI Advisor</span>
        </a>

        <a href="/budgets" class="thumb-action-card">
          <div class="thumb-action-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #cbd5e1;">Budgets</span>
        </a>
      </div>

      <!-- Horizontal Swipeable Accounts Carousel -->
      ${accountsCarouselHtml}

      <!-- Monthly Budget Health Bar -->
      <div class="card" style="padding: 14px; margin-bottom: 14px;">
        <div class="flex items-center justify-between" style="font-size: 12px; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #ffffff;">Monthly Budget Health</span>
          <span style="font-size: 11px; color: var(--text-muted); font-family: ui-monospace, monospace;">${budgetPct}% used</span>
        </div>
        <div style="width: 100%; background: #1e293b; border-radius: 9999px; height: 10px; overflow: hidden; position: relative; margin-bottom: 8px;">
          <div style="background: linear-gradient(90deg, #3b82f6, #0d9488, #10b981); height: 100%; border-radius: 9999px; width: ${budgetPct}%;"></div>
        </div>
        <div class="flex justify-between" style="font-size: 10.5px; color: var(--text-muted);">
          <span>SAR <span class="privacy-val">${fmt(expenses)}</span> spent</span>
          <span style="color: #34d399; font-weight: 600;">SAR <span class="privacy-val">${fmt(budgetRemaining)}</span> remaining</span>
        </div>
      </div>

      ${alertsHtml}

      <!-- Recent Transactions Feed -->
      <div>
        <div class="flex items-center justify-between" style="margin-bottom: 10px;">
          <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Recent Transactions</h3>
          <a href="/expenses" style="font-size: 11px; color: var(--primary); font-weight: 600;">View All →</a>
        </div>
        <div>
          ${recentHtml}
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
