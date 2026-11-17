import { baseLayout, esc, fmt } from './base.js';

export function budgetsPage({ user, budgets = [], spendingMap = {}, flash = [] }) {
  const categories = [
    'Rent', 'Groceries', 'Food & Dining', 'Utilities', 'Transport',
    'Shopping', 'Entertainment', 'Medical', 'Education', 'Insurance',
    'Bills & Subscriptions', 'Materials', 'Other'
  ];

  const totalBudgeted = budgets.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const totalSpentInBudgets = budgets.reduce((s, b) => s + (spendingMap[b.category] || 0), 0);
  const overallPct = totalBudgeted > 0 ? Math.min(totalSpentInBudgets / totalBudgeted, 1) : 0;

  const budgetCards = budgets.map(b => {
    const spent = spendingMap[b.category] || 0;
    const pct = b.monthly_limit > 0 ? Math.min(spent / b.monthly_limit, 1) : 0;
    const isAlert = pct >= (b.alert_threshold || 0.8);
    const isOver = pct >= 1;
    const statusClass = isOver ? 'exceeded' : isAlert ? 'warning' : 'ok';
    const badgeClass = isOver ? 'badge-danger' : isAlert ? 'badge-warning' : 'badge-success';
    const badgeText = isOver ? 'Over Budget' : isAlert ? 'Near Limit' : 'On Track';

    return `
    <div class="card ${isOver ? 'card-accent-red' : isAlert ? 'card-accent-amber' : 'card-accent-green'}" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h4 style="font-weight:700;font-size:16px;margin:0;color:var(--text);">${esc(b.category)}</h4>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <p style="font-size:12.5px;color:var(--text-muted);margin:4px 0 0;">Limit: SAR ${fmt(b.monthly_limit)} / month</p>
        </div>
        <form method="POST" action="/budget/${b.id}/delete" onsubmit="return confirm('Delete budget for ${esc(b.category)}?')" style="margin:0;">
          <button type="submit" class="btn-ghost" style="padding:6px;border-radius:6px;color:var(--text-light);cursor:pointer;" title="Delete budget">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </form>
      </div>

      <div class="budget-progress-container" style="height:8px;margin-bottom:10px;">
        <div class="budget-progress-bar ${statusClass}" style="width:${Math.round(pct * 100)}%;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);">
        <span>Spent: <strong style="color:var(--text);">SAR ${fmt(spent)}</strong></span>
        <span style="font-weight:700;color:${isOver ? 'var(--red-600)' : isAlert ? 'var(--amber-500)' : 'var(--green-600)'};">${Math.round(pct * 100)}%</span>
        <span>Left: <strong style="color:${isOver ? 'var(--red-600)' : 'var(--text)'};">SAR ${fmt(Math.max(b.monthly_limit - spent, 0))}</strong></span>
      </div>
    </div>`;
  }).join('') || `<div class="card empty-state" style="grid-column:1/-1;text-align:center;padding:48px 24px;"><p style="color:var(--text-light);margin-bottom:14px;">No budgets created yet. Set monthly spending targets to keep your expenses in check!</p><button onclick="openModal('addBudgetModal')" class="btn btn-primary btn-sm">Create First Budget</button></div>`;

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Budgets & Limits</h2>
        <p class="page-subtitle">Set monthly category limits and get notified before you overspend.</p>
      </div>
      <button onclick="openModal('addBudgetModal')" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Budget
      </button>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <!-- Overall Budget Health Strip -->
      ${budgets.length > 0 ? `
      <div class="card" style="margin-bottom:24px;background:var(--surface);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
          <div>
            <span style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;">Overall Monthly Budget Utilization</span>
            <h3 style="font-size:24px;font-weight:900;color:var(--text);margin:2px 0 0;">
              SAR ${fmt(totalSpentInBudgets)} <span style="font-size:16px;color:var(--text-muted);font-weight:500;">/ ${fmt(totalBudgeted)} SAR</span>
            </h3>
          </div>
          <span class="badge ${overallPct >= 1 ? 'badge-danger' : overallPct >= 0.8 ? 'badge-warning' : 'badge-success'}" style="font-size:13px;padding:6px 12px;">
            ${Math.round(overallPct * 100)}% Used
          </span>
        </div>
        <div class="budget-progress-container" style="height:10px;">
          <div class="budget-progress-bar ${overallPct >= 1 ? 'exceeded' : overallPct >= 0.8 ? 'warning' : 'ok'}" style="width:${Math.round(overallPct * 100)}%;"></div>
        </div>
      </div>` : ''}

      <!-- Budget Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;margin-bottom:24px;">
        ${budgetCards}
      </div>
    </div>

    <!-- Add Budget Modal -->
    <div id="addBudgetModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Category Budget</h3>
          <button class="modal-close" onclick="closeModal('addBudgetModal')">✕</button>
        </div>
        <form method="POST" action="/budget">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" name="category" list="budgetCats" required class="form-control" placeholder="Select or type category…">
            <datalist id="budgetCats">${categories.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Limit (SAR)</label>
            <input type="number" name="monthly_limit" step="0.01" min="1" required class="form-control" placeholder="e.g. 1500.00">
          </div>
          <div class="form-group">
            <label class="form-label">Alert Threshold (%)</label>
            <input type="number" name="alert_threshold" value="80" min="10" max="100" class="form-control">
            <p style="font-size:11px;color:var(--text-light);margin:4px 0 0;">Receive an alert when spending hits this percentage.</p>
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Save Budget</button>
        </form>
      </div>
    </div>`;

  return baseLayout({
    title: 'Budgets',
    activePage: 'budgets',
    content,
    user,
    flash
  });
}
