import { baseLayout, esc, fmt } from './base.js';

export function dashboardPage({ user, accounts, income, expenses, totalBalance, recentTransactions, budgetAlerts, flash }) {
  const net = income - expenses;
  const accLen = accounts.length;

  const alertsHtml = budgetAlerts.length ? `
    <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,#7f1d1d,#dc2626);border-color:transparent;color:white;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="background:rgba(255,255,255,.18);padding:10px;border-radius:10px;flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style="flex:1;">
          <p style="font-weight:700;font-size:13px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">⚠ Budget Alerts</p>
          ${budgetAlerts.map(a => `<div style="font-size:14px;margin-bottom:4px;">• <strong>${esc(a.category)}</strong>: SAR ${fmt(a.spent)} / ${fmt(a.limit)} (${Math.round(a.pct * 100)}%)</div>`).join('')}
        </div>
      </div>
    </div>` : '';

  const recentHtml = recentTransactions.length ? recentTransactions.map(t => `
    <div class="transaction-item">
      <div class="transaction-icon ${t.type}" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${t.type === 'income' ? 'rgba(22,163,74,.12)' : t.type === 'expense' ? 'rgba(220,38,38,.12)' : 'rgba(37,99,235,.12)'};">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${t.type === 'income' ? '#16a34a' : t.type === 'expense' ? '#dc2626' : '#2563eb'}" stroke-width="2">
          ${t.type === 'income' ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' : t.type === 'expense' ? '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>' : '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>'}
        </svg>
      </div>
      <div class="transaction-info" style="flex:1;min-width:0;">
        <p class="transaction-category" style="font-weight:600;font-size:14px;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.category)}</p>
        <p class="transaction-meta" style="font-size:12px;color:var(--gray-500);margin:0;">${esc(t.date)} • ${esc(t.account_name || '—')}</p>
      </div>
      <div class="transaction-amount ${t.type}" style="font-weight:700;font-size:15px;color:${t.type === 'income' ? '#16a34a' : t.type === 'expense' ? '#dc2626' : '#2563eb'};">
        ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}SAR ${fmt(t.amount)}
      </div>
    </div>`).join('') : '<p style="text-align:center;color:var(--gray-400);padding:24px 0;">No transactions yet</p>';

  const accountsHtml = accounts.slice(0, 4).map(a => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:${a.type === 'bank' ? 'linear-gradient(135deg,#1e3c72,#2a5298)' : a.type === 'mobile' ? 'linear-gradient(135deg,#6a11cb,#2575fc)' : 'linear-gradient(135deg,#11998e,#38ef7d)'};display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            ${a.type === 'bank' ? '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>' : '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'}
          </svg>
        </div>
        <div>
          <p style="font-weight:600;font-size:14px;margin:0;">${esc(a.name)}</p>
          <p style="font-size:11px;color:var(--gray-500);text-transform:uppercase;margin:0;">${esc(a.type)}</p>
        </div>
      </div>
      <div style="font-weight:700;font-size:15px;">SAR ${fmt(a.balance)}</div>
    </div>`).join('');

  const content = `
    <div class="page-banner">
      <div class="page-banner-inner">
        <div>
          <h1 class="page-title">Good day, ${esc((user?.full_name || user?.name || user?.email || 'User').split(' ')[0])} 👋</h1>
          <p class="page-subtitle">Here's your financial snapshot for today.</p>
        </div>
        <a href="/expenses" class="btn btn-primary btn-sm" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Expense
        </a>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Hero Balance -->
      <div class="hero-balance-card">
        <div class="hero-balance-inner">
          <p class="hero-balance-label">Total Net Worth</p>
          <h2 class="hero-balance-amount">${fmt(totalBalance)} <span style="font-size:24px;font-weight:600;opacity:.5;">SAR</span></h2>
          <div class="hero-balance-meta">
            <span class="hero-balance-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              ${accLen} account${accLen !== 1 ? 's' : ''}
            </span>
            <span class="hero-balance-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Updated now
            </span>
          </div>
        </div>
      </div>

      <!-- Summary Row -->
      <div class="summary-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-bottom:24px;">
        <div class="summary-card success-card">
          <p class="summary-label">Monthly Income</p>
          <h3 class="summary-value">${fmt(income)} SAR</h3>
          <div class="summary-trend positive"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> This month</div>
        </div>
        <div class="summary-card danger-card">
          <p class="summary-label">Monthly Expenses</p>
          <h3 class="summary-value">${fmt(expenses)} SAR</h3>
          <div class="summary-trend negative"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg> This month</div>
        </div>
        <div class="summary-card accent">
          <p class="summary-label">Net Savings</p>
          <h3 class="summary-value">${fmt(net)} SAR</h3>
          <div class="summary-trend" style="background:rgba(255,255,255,.15);color:rgba(255,255,255,.85);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Income – Expenses
          </div>
        </div>
      </div>

      <!-- AI Insights -->
      <div class="card card-accent-blue" style="margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;gap:14px;">
          <div style="background:linear-gradient(135deg,#2563eb,#0d9488);padding:10px;border-radius:10px;flex-shrink:0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div style="flex:1;">
            <p style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">AI Financial Insights</p>
            <div id="aiSummary">
              <div class="ai-summary-skeleton">
                <div class="skeleton skeleton-text" style="width:92%;"></div>
                <div class="skeleton skeleton-text" style="width:76%;"></div>
                <div class="skeleton skeleton-text" style="width:58%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${alertsHtml}

      <!-- Two-column: recent transactions + accounts -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;" class="dashboard-grid">
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 class="card-title">Recent Transactions</h3>
            <a href="/expenses" style="font-size:13px;color:var(--primary);">View all →</a>
          </div>
          ${recentHtml}
        </div>
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 class="card-title">My Accounts</h3>
            <a href="/accounts" style="font-size:13px;color:var(--primary);">Manage →</a>
          </div>
          ${accountsHtml}
          ${accounts.length === 0 ? '<p style="text-align:center;color:var(--gray-400);padding:16px 0;">No accounts yet</p>' : ''}
        </div>
      </div>
    </div>`;

  return baseLayout({
    title: 'Dashboard', activePage: 'dashboard', content, user, flash,
    scripts: `<script>
      // Load AI summary
      fetch('/api/summary').then(r=>r.json()).then(d=>{
        document.getElementById('aiSummary').innerHTML = '<p style="font-size:14px;color:var(--text);line-height:1.6;">' + (d.summary||'No data available.') + '</p>';
      }).catch(()=>{
        document.getElementById('aiSummary').innerHTML = '<p style="font-size:14px;color:var(--gray-500);">Could not load AI summary.</p>';
      });
    </script>`
  });
}
