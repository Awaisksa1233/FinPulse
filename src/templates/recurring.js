import { baseLayout, esc, fmt, today as getToday } from './base.js';

export function recurringPage({ user, templates = [], accounts = [], flash = [] }) {
  const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

  const rows = templates.map(t => {
    const acc = accounts.find(a => a.id === t.account_id);
    const isInc = t.type === 'income';
    return `
    <div class="card ${isInc ? 'card-accent-green' : 'card-accent-red'}" style="display:flex;align-items:center;gap:16px;padding:16px 20px;margin-bottom:12px;">
      <div style="width:42px;height:42px;border-radius:12px;background:${isInc ? 'var(--green-100)' : 'var(--red-100)'};color:${isInc ? 'var(--green-600)' : 'var(--red-600)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          ${isInc ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'}
        </svg>
      </div>

      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <h4 style="font-weight:700;font-size:15px;margin:0;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${esc(t.description)}
          </h4>
          <span class="badge ${isInc ? 'badge-success' : 'badge-danger'}">
            ${freqLabel[t.frequency] || t.frequency}
          </span>
        </div>
        <p style="font-size:12.5px;color:var(--text-muted);margin:4px 0 0;">
          ${esc(t.category)} · ${esc(acc ? acc.name : 'Unassigned account')}
        </p>
      </div>

      <div style="text-align:right;flex-shrink:0;">
        <p style="font-weight:800;font-size:16px;color:${isInc ? 'var(--green-600)' : 'var(--red-600)'};margin:0;">
          ${isInc ? '+' : '-'}SAR ${fmt(t.amount)}
        </p>
        <span class="badge badge-accent" style="font-size:11px;margin-top:4px;">
          Next: ${t.next_date || '—'}
        </span>
      </div>

      <form method="POST" action="/recurring/${t.id}/delete" onsubmit="return confirm('Delete recurring template for ${esc(t.description)}?')" style="margin:0;flex-shrink:0;">
        <button type="submit" class="btn-ghost" style="padding:6px;border-radius:6px;color:var(--text-light);cursor:pointer;" title="Delete recurring template">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </form>
    </div>`;
  }).join('') || `<div class="card empty-state" style="text-align:center;padding:48px 24px;"><p style="color:var(--text-light);margin-bottom:14px;">No recurring templates configured. Automate regular salaries, rent, or subscriptions!</p><button onclick="openModal('addRecurringModal')" class="btn btn-primary btn-sm">Create First Recurring Template</button></div>`;

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)} (SAR ${fmt(a.balance)})</option>`).join('');
  const categories = ['Salary', 'Freelance', 'Rent', 'Utilities', 'Groceries', 'Food & Dining', 'Transport', 'Entertainment', 'Shopping', 'Medical', 'Education', 'Insurance', 'Subscriptions', 'Loan Payment', 'Other'];

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Recurring Subscriptions & Bills</h2>
        <p class="page-subtitle">Templates automatically scheduled to process at midnight triggers.</p>
      </div>
      <button onclick="openModal('addRecurringModal')" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Recurring Template
      </button>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      ${rows}
    </div>

    <!-- Add Recurring Modal -->
    <div id="addRecurringModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Recurring Template</h3>
          <button class="modal-close" onclick="closeModal('addRecurringModal')">✕</button>
        </div>
        <form method="POST" action="/recurring">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select name="type" class="form-control" required>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select name="frequency" class="form-control" required>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" name="description" required class="form-control" placeholder="e.g. Netflix, Rent, Monthly Salary">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" name="category" list="recCats" class="form-control" placeholder="Select or type…">
              <datalist id="recCats">${categories.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (SAR)</label>
              <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" placeholder="0.00">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Target Account</label>
              <select name="account_id" class="form-control" required>
                <option value="">Select account…</option>
                ${accountOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" name="start_date" value="${getToday()}" required class="form-control">
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Save Template</button>
        </form>
      </div>
    </div>`;

  return baseLayout({
    title: 'Recurring Templates',
    activePage: 'recurring',
    content,
    user,
    flash
  });
}
