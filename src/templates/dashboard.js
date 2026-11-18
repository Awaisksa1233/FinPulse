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
  const userName = (user?.full_name || user?.name || user?.email || 'User').split(' ')[0];

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
    if (c.includes('movie') || c.includes('netflix') || c.includes('entertainment')) return '🎬';
    if (c.includes('travel') || c.includes('flight')) return '✈️';
    return '💳';
  }

  const alertsHtml = budgetAlerts.length ? `
    <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);border-color:transparent;color:white;box-shadow:0 12px 32px -8px rgba(220,38,38,.4);">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="background:rgba(255,255,255,.18);padding:10px;border-radius:12px;flex-shrink:0;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style="flex:1;">
          <p style="font-weight:700;font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.6px;">⚠ Budget Alerts (${budgetAlerts.length})</p>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${budgetAlerts.map(a => `<div style="font-size:13.5px;opacity:.95;">• <strong>${esc(a.category)}</strong>: SAR <span class="privacy-val">${fmt(a.spent)}</span> / ${fmt(a.monthly_limit || a.limit)} (${Math.round((a.pct || 0) * 100)}%)</div>`).join('')}
          </div>
          <a href="/budgets" style="display:inline-block;margin-top:10px;font-size:12.5px;color:rgba(255,255,255,.9);text-decoration:underline;font-weight:600;">Manage Budgets →</a>
        </div>
      </div>
    </div>` : '';

  const recentHtml = recentTransactions.length ? recentTransactions.map(t => {
    const isInc = t.type === 'income';
    const isExp = t.type === 'expense';
    const catEmoji = getCatEmoji(t.category);
    return `
    <div class="transaction-item" style="margin-bottom:8px;">
      <div class="transaction-info">
        <div class="transaction-icon ${t.type}" style="font-size:16px;display:flex;align-items:center;justify-content:center;">
          ${catEmoji}
        </div>
        <div>
          <div class="transaction-category" style="font-weight:600;">${esc(t.category)}</div>
          <div class="transaction-meta">${esc(t.date)}${t.account_name ? ' • ' + esc(t.account_name) : ''}${t.description ? ' • ' + esc(t.description) : ''}</div>
        </div>
      </div>
      <div class="transaction-amount ${t.type}" style="font-weight:700;">
        ${isInc ? '+' : isExp ? '-' : ''}SAR <span class="privacy-val">${fmt(t.amount)}</span>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;color:var(--text-light);padding:32px 0;"><p>No transactions yet.</p><button type="button" onclick="openQuickAddSheet(\'expense\')" class="btn btn-outline btn-sm" style="margin-top:8px;">Add your first</button></div>';

  const accountsCarouselHtml = accounts.length ? `
    <div class="accounts-carousel-wrap">
      <div class="accounts-carousel-header">
        <h3 class="accounts-carousel-title">My Accounts (${accounts.length})</h3>
        <a href="/accounts" style="font-size:12px;color:var(--blue-600);font-weight:600;text-decoration:none;">Manage →</a>
      </div>
      <div class="accounts-carousel">
        ${accounts.map(a => {
          const isBank = a.type === 'bank';
          const isMobile = a.type === 'mobile';
          return `
          <a href="/accounts" class="account-snap-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:12.5px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${isBank ? '#3b82f6' : isMobile ? '#8b5cf6' : '#10b981'};"></span>
                ${esc(a.name)}
              </span>
              <span style="font-size:10px;text-transform:uppercase;color:var(--text-muted);font-weight:700;background:var(--surface-2);padding:2px 7px;border-radius:10px;border:1px solid var(--border);">${esc(a.type)}</span>
            </div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-bottom:2px;">Available Balance</div>
            <div style="font-size:20px;font-weight:800;color:var(--text);letter-spacing:-0.4px;">
              SAR <span class="privacy-val">${fmt(a.balance)}</span>
            </div>
          </a>`;
        }).join('')}
      </div>
    </div>` : '';

  // Budget progress list
  const budgetListHtml = budgetProgress.length ? budgetProgress.slice(0, 5).map(b => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;">
        <span style="font-weight:600;color:var(--text);">${esc(b.category)}</span>
        <span style="color:var(--text-muted);font-size:12px;">SAR <span class="privacy-val">${fmt(b.spent)}</span> / ${fmt(b.monthly_limit)}</span>
      </div>
      <div class="budget-progress-container">
        <div class="budget-progress-bar ${b.status}" style="width:${b.progress_pct}%;"></div>
      </div>
    </div>`).join('') : `
    <div style="text-align:center;padding:24px 0;color:var(--text-light);">
      <p style="font-size:13.5px;margin-bottom:10px;">No budgets set for this month</p>
      <a href="/budgets" class="btn btn-outline btn-sm">Create Budget</a>
    </div>`;

  const categories = Object.keys(categorySpend);
  const spendValues = Object.values(categorySpend);
  const hasSpendData = categories.length > 0 && spendValues.some(v => v > 0);

  const content = `
    <!-- Page Banner -->
    <div class="page-banner">
      <div class="page-banner-inner">
        <div>
          <h1 class="page-title">Good day, ${esc(userName)} 👋</h1>
          <p class="page-subtitle">Here's your smart financial snapshot for this month.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button type="button" onclick="togglePrivacy()" class="btn btn-sm" style="background:var(--surface);border:1px solid var(--border);color:var(--text);" title="Privacy Mode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Privacy
          </button>
          <button type="button" onclick="openQuickAddSheet('income')" class="btn btn-sm" style="background:rgba(22,163,74,.2);border:1px solid rgba(22,163,74,.35);color:#4ade80;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            Add Income
          </button>
          <button type="button" onclick="openQuickAddSheet('expense')" class="btn btn-primary btn-sm" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);color:white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Expense
          </button>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Hero Balance Card -->
      <div class="hero-balance-card">
        <div class="hero-balance-inner">
          <p class="hero-balance-label">Total Net Worth</p>
          <h2 class="hero-balance-amount"><span class="privacy-val">${fmt(totalBalance)}</span> <span style="font-size:24px;font-weight:600;opacity:.55;">SAR</span></h2>
          <div class="hero-balance-meta">
            <span class="hero-balance-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              ${accLen} active account${accLen !== 1 ? 's' : ''}
            </span>
            <span class="hero-balance-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Live Edge Sync
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Action Thumb Row -->
      <div class="thumb-actions-grid">
        <button type="button" onclick="openQuickAddSheet('expense')" class="thumb-action-card">
          <div class="thumb-action-icon expense">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <span>Expense</span>
        </button>
        <button type="button" onclick="openQuickAddSheet('income')" class="thumb-action-card">
          <div class="thumb-action-icon income">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <span>Income</span>
        </button>
        <a href="/chat" class="thumb-action-card">
          <div class="thumb-action-icon ai">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span>AI Advisor</span>
        </a>
        <a href="/budgets" class="thumb-action-card">
          <div class="thumb-action-icon budgets">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span>Budgets</span>
        </a>
      </div>

      <!-- Horizontal Swipeable Accounts Carousel -->
      ${accountsCarouselHtml}

      <!-- Summary Cards Row -->
      <div class="summary-grid">
        <div class="summary-card success-card">
          <p class="summary-label">Monthly Income</p>
          <h3 class="summary-value"><span class="privacy-val">${fmt(income)}</span> SAR</h3>
          <div class="summary-trend positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            This Month
          </div>
        </div>

        <div class="summary-card danger-card">
          <p class="summary-label">Monthly Expenses</p>
          <h3 class="summary-value"><span class="privacy-val">${fmt(expenses)}</span> SAR</h3>
          <div class="summary-trend negative">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
            This Month
          </div>
        </div>

        <div class="summary-card accent">
          <p class="summary-label">Net Savings</p>
          <h3 class="summary-value"><span class="privacy-val">${fmt(net)}</span> SAR</h3>
          <div class="summary-trend">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ${income > 0 ? Math.round((net / income) * 100) + '% savings rate' : 'Income – Expenses'}
          </div>
        </div>
      </div>

      <!-- AI Financial Insights -->
      <div class="card card-accent-blue" style="margin-bottom:24px;background:var(--surface);">
        <div style="display:flex;align-items:flex-start;gap:14px;">
          <div style="background:linear-gradient(135deg,#2563eb,#0d9488);width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(37,99,235,.35);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <p style="font-weight:700;font-size:13px;color:var(--text);margin:0;text-transform:uppercase;letter-spacing:.6px;">AI Financial Insights</p>
              <button onclick="refreshSummary()" id="refreshSummaryBtn" class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:12px;" title="Refresh summary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh
              </button>
            </div>
            <div id="aiSummary">
              <div class="ai-summary-skeleton">
                <div class="skeleton skeleton-text" style="width:94%;margin-bottom:6px;"></div>
                <div class="skeleton skeleton-text" style="width:78%;margin-bottom:6px;"></div>
                <div class="skeleton skeleton-text" style="width:52%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${alertsHtml}

      <!-- Charts & Budget Progress Grid -->
      <div class="grid grid-2" style="margin-bottom:24px;">
        <!-- Expense Breakdown Chart -->
        <div class="card card-accent-blue">
          <div class="card-header">
            <h3 class="card-title">Expense Breakdown</h3>
            <a href="/reports" style="font-size:12.5px;color:var(--blue-600);font-weight:600;text-decoration:none;">Full Analytics →</a>
          </div>
          ${hasSpendData ? `
          <div class="chart-container" style="height:240px;position:relative;">
            <canvas id="expenseDoughnut"></canvas>
          </div>` : `
          <div style="text-align:center;padding:48px 16px;color:var(--text-light);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><path d="M16 8l-8 8"/></svg>
            <p style="font-size:13.5px;margin:0;">No expenses logged this month yet</p>
          </div>`}
        </div>

        <!-- Budget Progress -->
        <div class="card card-accent-teal">
          <div class="card-header">
            <h3 class="card-title">Budget Progress</h3>
            <a href="/budgets" style="font-size:12.5px;color:var(--blue-600);font-weight:600;text-decoration:none;">Manage →</a>
          </div>
          ${budgetListHtml}
        </div>
      </div>

      <!-- Recent Transactions Full-Width Card -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">Recent Activity</h3>
          <a href="/expenses" style="font-size:12.5px;color:var(--blue-600);font-weight:600;text-decoration:none;">View all →</a>
        </div>
        ${recentHtml}
      </div>
    </div>`;

  const chartDataJson = JSON.stringify({
    labels: categories,
    values: spendValues
  });

  const scripts = `
  <script>
    // Load AI summary
    function refreshSummary() {
      const box = document.getElementById('aiSummary');
      const btn = document.getElementById('refreshSummaryBtn');
      if (btn) btn.disabled = true;
      box.innerHTML = '<div class="ai-summary-skeleton"><div class="skeleton skeleton-text" style="width:90%;margin-bottom:6px;"></div><div class="skeleton skeleton-text" style="width:70%;"></div></div>';
      fetch('/api/summary')
        .then(r => r.json())
        .then(d => {
          box.innerHTML = '<p style="font-size:14px;color:var(--text);line-height:1.65;margin:0;">' + (d.summary || 'No data available.') + '</p>';
          if (btn) btn.disabled = false;
        })
        .catch(() => {
          box.innerHTML = '<p style="font-size:14px;color:var(--text-muted);margin:0;">Could not load AI summary at this time.</p>';
          if (btn) btn.disabled = false;
        });
    }
    refreshSummary();

    // Render Doughnut Chart
    (function() {
      const chartCanvas = document.getElementById('expenseDoughnut');
      if (!chartCanvas) return;
      const data = ${chartDataJson};
      if (!data.labels.length || !data.values.some(v => v > 0)) return;

      const palette = [
        '#2563eb', '#0d9488', '#f59e0b', '#dc2626', '#8b5cf6',
        '#ec4899', '#06b6d4', '#10b981', '#6366f1', '#f97316'
      ];

      new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: palette.slice(0, data.labels.length),
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                font: { family: 'Inter', size: 11, weight: '500' },
                color: '#64748b',
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  const val = ctx.raw || 0;
                  return ' ' + ctx.label + ': SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 });
                }
              }
            }
          },
          cutout: '72%'
        }
      });
    })();
  </script>`;

  return baseLayout({
    title: 'Dashboard',
    activePage: 'dashboard',
    content,
    scripts,
    user,
    flash
  });
}
