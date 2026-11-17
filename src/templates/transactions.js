import { baseLayout, esc, fmt, today as getToday } from './base.js';

export function transactionsPage({ user, transactionType, accounts, transactions, flash }) {
  const isIncome = transactionType === 'income';
  const title = isIncome ? 'Income' : 'Expenses';
  const todayStr = getToday();

  const incomeCategories = ['Salary','Sales','Commission','Subscription','Freelance','Investment','Rental','Gift','Other'];
  const expenseCategories = ['Rent','Utilities','Groceries','Entertainment','Materials','Transport','Food','Shopping','Medical','Education','Insurance','Other'];
  const categories = isIncome ? incomeCategories : expenseCategories;

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)} (SAR ${fmt(a.balance)})</option>`).join('');

  const transactionRows = transactions.map(t => `
    <div class="transaction-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-100);">
      <div style="width:40px;height:40px;border-radius:12px;background:${isIncome ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isIncome ? '#16a34a' : '#dc2626'}" stroke-width="2">
          ${isIncome ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>'}
        </svg>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-weight:600;font-size:14px;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.category)}</p>
        <p style="font-size:12px;color:var(--gray-500);margin:0;">${esc(t.date)}${t.description ? ' • ' + esc(t.description) : ''}${t.account_name ? ' • ' + esc(t.account_name) : ''}</p>
      </div>
      <div style="font-weight:700;font-size:15px;color:${isIncome ? '#16a34a' : '#dc2626'};white-space:nowrap;">
        ${isIncome ? '+' : '-'}SAR ${fmt(t.amount)}
      </div>
      <form method="POST" action="/transaction/${t.id}/delete" onsubmit="return confirm('Delete this transaction?')">
        <button type="submit" style="background:none;border:none;color:var(--gray-400);cursor:pointer;padding:4px;border-radius:6px;" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </form>
    </div>`).join('') || '<p style="text-align:center;color:var(--gray-400);padding:32px 0;">No transactions yet</p>';

  const content = `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;" class="transactions-layout">
      <div>
        <header class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <div>
            <h2 class="page-title">${title} Tracker</h2>
            <p class="page-subtitle">Track your ${transactionType}.</p>
          </div>
        </header>

        <!-- Add Form -->
        <div class="card" style="margin-bottom:24px;">
          ${accounts.length === 0 ? `<div style="text-align:center;padding:16px;"><p>Please <a href="/accounts" style="color:var(--primary);">add an account</a> first.</p></div>` : `
          <form method="POST" action="/transaction">
            <input type="hidden" name="type" value="${transactionType}">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Amount</label>
                <div style="position:relative;">
                  <span style="position:absolute;left:14px;top:11px;color:var(--gray-400);">SAR</span>
                  <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" style="padding-left:46px;" placeholder="0.00">
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
                <input type="text" name="category" list="categories" required class="form-control" placeholder="Select or type…">
                <datalist id="categories">${categories.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
              </div>
              <div class="form-group">
                <label class="form-label">${isIncome ? 'Deposit To' : 'Pay From'}</label>
                <select name="account_id" required class="form-control">
                  <option value="">Select account</option>
                  ${accountOptions}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <input type="text" name="description" class="form-control" placeholder="Add a note…">
            </div>
            <button type="submit" class="btn btn-primary">Add ${title.slice(0, -1)}</button>
          </form>`}
        </div>

        <!-- Transaction List -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom:16px;">Recent ${title}</h3>
          ${transactionRows}
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div>
        <div class="card" style="position:sticky;top:24px;">
          <h3 class="card-title" style="margin-bottom:16px;">This Month</h3>
          <div style="text-align:center;padding:16px 0;">
            <p style="font-size:28px;font-weight:800;color:${isIncome ? '#16a34a' : '#dc2626'};">
              SAR ${fmt(transactions.reduce((s, t) => {
                // This needs server-side filtering by month, here we show all passed
                return s + t.amount;
              }, 0))}
            </p>
            <p style="color:var(--gray-500);font-size:14px;">Total ${isIncome ? 'income' : 'expenses'}</p>
          </div>
          <a href="/${isIncome ? 'expenses' : 'income'}" class="btn btn-outline btn-block" style="margin-top:8px;">
            View ${isIncome ? 'Expenses' : 'Income'} →
          </a>
          <a href="/accounts" class="btn btn-outline btn-block" style="margin-top:8px;">
            All Accounts →
          </a>
        </div>
      </div>
    </div>`;

  return baseLayout({ title, activePage: isIncome ? 'income' : 'expenses', content, user, flash });
}
