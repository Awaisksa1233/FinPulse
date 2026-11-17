import { baseLayout, esc, fmt } from './base.js';

export function recurringPage({ user, templates, accounts, flash }) {
  const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

  const rows = templates.map(t => {
    const acc = accounts.find(a => a.id === t.account_id);
    return `
    <div class="card" style="display:flex;align-items:center;gap:16px;padding:16px;">
      <div style="width:40px;height:40px;border-radius:50%;background:${t.type === 'income' ? '#d1fae5' : '#fee2e2'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${t.type === 'income'
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'}
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-weight:600;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.description)}</p>
        <p style="font-size:13px;color:var(--gray-500);margin:0;">${esc(t.category)} · ${esc(acc ? acc.name : 'Unknown')} · ${freqLabel[t.frequency] || t.frequency}</p>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <p style="font-weight:700;color:${t.type === 'income' ? '#16a34a' : '#dc2626'};margin:0;">SAR ${fmt(t.amount)}</p>
        <p style="font-size:12px;color:var(--gray-400);margin:0;">Next: ${t.next_date || '—'}</p>
      </div>
      <form method="POST" action="/recurring/${t.id}/delete" onsubmit="return confirm('Delete recurring?')" style="flex-shrink:0;">
        <button type="submit" style="background:none;border:none;color:var(--gray-400);cursor:pointer;padding:4px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </form>
    </div>`;
  }).join('') || '<div class="card empty-state" style="text-align:center;padding:40px;"><p>No recurring transactions. Add one to auto-track bills and income.</p></div>';

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
  const categories = ['Salary','Freelance','Rent','Utilities','Groceries','Food','Transport','Entertainment','Shopping','Medical','Education','Insurance','Subscription','Loan Payment','Other'];

  const content = `
    <header class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div><h2 class="page-title">Recurring</h2><p class="page-subtitle">Automatic income and expense templates.</p></div>
      <button onclick="openModal('addRecurringModal')" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Add Recurring
      </button>
    </header>

    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
      ${rows}
    </div>

    <!-- Add Recurring Modal -->
    <div id="addRecurringModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Recurring</h3>
          <button class="modal-close" onclick="closeModal('addRecurringModal')">✕</button>
        </div>
        <form method="POST" action="/recurring">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select name="type" class="form-control" required>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" name="description" required class="form-control" placeholder="e.g. Netflix subscription">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" name="category" list="recCats" class="form-control" placeholder="Select or type…">
            <datalist id="recCats">${categories.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (SAR)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Account</label>
            <select name="account_id" class="form-control" required>${accountOptions}</select>
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
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" name="start_date" required class="form-control">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save</button>
        </form>
      </div>
    </div>`;

  return baseLayout({ title: 'Recurring', activePage: 'recurring', content, user, flash });
}
