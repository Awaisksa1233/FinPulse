import { baseLayout, esc, fmt, today as getToday } from './base.js';

export function transactionsPage({ user, transactionType, accounts = [], transactions = [], flash = [] }) {
  const isIncome = transactionType === 'income';
  const title = isIncome ? 'Income' : 'Expenses';
  const todayStr = getToday();

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Sales', 'Commission', 'Rental', 'Subscription', 'Gift', 'Cashback', 'Other'];
  const expenseCategories = ['Rent', 'Groceries', 'Food & Dining', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Medical', 'Education', 'Insurance', 'Bills', 'Other'];
  const categories = isIncome ? incomeCategories : expenseCategories;

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)} (SAR ${fmt(a.balance)})</option>`).join('');

  const totalThisView = transactions.reduce((s, t) => s + (t.amount || 0), 0);

  const transactionRows = transactions.length ? transactions.map(t => `
    <div class="transaction-item" style="margin-bottom:8px;">
      <div class="transaction-info">
        <div class="transaction-icon ${isIncome ? 'income' : 'expense'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            ${isIncome ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'}
          </svg>
        </div>
        <div>
          <div class="transaction-category" style="display:flex;align-items:center;gap:6px;">
            <span>${esc(t.category)}</span>
            ${t.budget_month ? `<span style="background:rgba(99,102,241,0.12);color:var(--primary);font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;" title="Budget Month">${esc(t.budget_month)}</span>` : ''}
          </div>
          <div class="transaction-meta">${esc(t.date)}${t.description ? ' • ' + esc(t.description) : ''}${t.account_name ? ' • ' + esc(t.account_name) : ''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="transaction-amount ${isIncome ? 'income' : 'expense'}" style="font-weight:700;">
          ${isIncome ? '+' : '-'}SAR ${fmt(t.amount)}
        </div>
        <form method="POST" action="/transaction/${t.id}/delete" onsubmit="return confirm('Delete this transaction?')" style="margin:0;">
          <button type="submit" class="btn-ghost" style="padding:6px;border-radius:6px;color:var(--text-light);display:flex;align-items:center;cursor:pointer;" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </form>
      </div>
    </div>`).join('') : '<div style="text-align:center;color:var(--text-light);padding:40px 0;"><p>No ' + transactionType + ' transactions logged yet.</p></div>';

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">${title} Tracker</h2>
        <p class="page-subtitle">Track, categorize, and control your ${transactionType}.</p>
      </div>
      <!-- Type Switcher Tabs -->
      <div class="timeframe-toggle" style="background:var(--surface);">
        <a href="/expenses" class="timeframe-btn ${!isIncome ? 'active' : ''}" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
          Expenses
        </a>
        <a href="/income" class="timeframe-btn ${isIncome ? 'active' : ''}" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
          Income
        </a>
      </div>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;" class="transactions-layout">
        <!-- Main Form & List -->
        <div>
          <!-- Quick Add Form -->
          <div class="card ${isIncome ? 'card-accent-green' : 'card-accent-red'}" style="margin-bottom:24px;">
            <div class="card-header">
              <h3 class="card-title">Add ${isIncome ? 'Income' : 'Expense'}</h3>
            </div>
            ${accounts.length === 0 ? `
            <div style="text-align:center;padding:24px 0;">
              <p style="color:var(--text-muted);margin-bottom:12px;">You need at least one account to record transactions.</p>
              <a href="/accounts" class="btn btn-primary btn-sm">Add an Account First</a>
            </div>` : `
            <form method="POST" action="/transaction">
              <input type="hidden" name="type" value="${transactionType}">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Amount (SAR)</label>
                  <div style="position:relative;">
                    <span style="position:absolute;left:14px;top:10px;color:var(--text-muted);font-weight:600;font-size:13px;">SAR</span>
                    <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" style="padding-left:48px;font-weight:700;" placeholder="0.00" autofocus>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Date</label>
                  <input type="date" name="date" value="${todayStr}" required class="form-control">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <input type="text" name="category" list="categories" required class="form-control" placeholder="Select or type category…">
                  <datalist id="categories">
                    ${categories.map(c => `<option value="${esc(c)}">`).join('')}
                  </datalist>
                </div>
                <div class="form-group">
                  <label class="form-label">${isIncome ? 'Deposit Into' : 'Paid From'}</label>
                  <select name="account_id" required class="form-control">
                    <option value="">Select account…</option>
                    ${accountOptions}
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Description / Note (optional)</label>
                  <input type="text" name="description" class="form-control" placeholder="e.g. Al Baik dinner, Uber trip, Monthly salary…">
                </div>
                <div class="form-group">
                  <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
                    <span>Budget Month</span>
                    <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">Auto (Salary day: ${user?.salary_day || 28}th)</span>
                  </label>
                  <input type="month" name="budget_month" class="form-control" title="Leave blank to calculate automatically based on your salary cycle">
                  <span style="font-size:11px;color:var(--text-muted);display:block;margin-top:4px;">
                    Auto: On/after day ${user?.salary_day || 28}, counts toward next month's budget.
                  </span>
                </div>
              </div>

              <button type="submit" class="btn ${isIncome ? 'btn-success' : 'btn-danger'}" style="width:100%;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Record ${isIncome ? 'Income' : 'Expense'}
              </button>
            </form>`}
          </div>

          <!-- Transaction List -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recorded ${title}</h3>
              <span style="font-size:12px;color:var(--text-muted);">${transactions.length} entries</span>
            </div>
            ${transactionRows}
          </div>
        </div>

        <!-- Sidebar Summary Sticky Box -->
        <div>
          <div class="card" style="position:sticky;top:20px;">
            <div class="card-header">
              <h3 class="card-title">Summary</h3>
            </div>
            <div style="text-align:center;padding:16px 0 20px;">
              <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:6px;">Total Logged</p>
              <h3 style="font-size:32px;font-weight:900;letter-spacing:-1px;color:${isIncome ? 'var(--green-600)' : 'var(--red-600)'};margin:0;">
                SAR ${fmt(totalThisView)}
              </h3>
            </div>

            <div class="divider"></div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              <a href="/${isIncome ? 'expenses' : 'income'}" class="btn btn-outline btn-block">
                Switch to ${isIncome ? 'Expenses' : 'Income'} →
              </a>
              <a href="/reports" class="btn btn-outline btn-block">
                View Reports & Trends →
              </a>
              <a href="/accounts" class="btn btn-outline btn-block">
                Manage Accounts & Wallets →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  return baseLayout({
    title,
    activePage: isIncome ? 'income' : 'expenses',
    content,
    user,
    flash
  });
}
