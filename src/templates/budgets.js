import { baseLayout, esc, fmt } from './base.js';

export function budgetsPage({ user, budgets, spendingMap, flash }) {
  const categories = ['Rent','Utilities','Groceries','Food','Transport','Entertainment','Shopping','Medical','Education','Insurance','Materials','Other'];

  const budgetCards = budgets.map(b => {
    const spent = spendingMap[b.category] || 0;
    const pct = b.monthly_limit > 0 ? Math.min(spent / b.monthly_limit, 1) : 0;
    const isAlert = pct >= b.alert_threshold;
    const isOver = pct >= 1;
    const color = isOver ? '#dc2626' : isAlert ? '#f59e0b' : '#16a34a';

    return `
    <div class="card" style="${isOver ? 'border-left:4px solid #dc2626;' : isAlert ? 'border-left:4px solid #f59e0b;' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <p style="font-weight:700;font-size:16px;margin:0;">${esc(b.category)}</p>
          <p style="font-size:13px;color:var(--gray-500);margin:0;">Limit: SAR ${fmt(b.monthly_limit)}/mo</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${isOver ? '<span style="font-size:12px;background:#fef2f2;color:#dc2626;padding:4px 8px;border-radius:6px;font-weight:600;">Over budget</span>' : isAlert ? '<span style="font-size:12px;background:#fffbeb;color:#d97706;padding:4px 8px;border-radius:6px;font-weight:600;">Near limit</span>' : ''}
          <form method="POST" action="/budget/${b.id}/delete" onsubmit="return confirm('Delete budget?')" style="display:inline;">
            <button type="submit" style="background:none;border:none;color:var(--gray-400);cursor:pointer;padding:4px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </form>
        </div>
      </div>
      <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${Math.round(pct * 100)}%;background:${color};border-radius:999px;transition:width .3s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray-600);">
        <span>Spent: SAR ${fmt(spent)}</span>
        <span style="color:${color};font-weight:600;">${Math.round(pct * 100)}%</span>
        <span>Left: SAR ${fmt(Math.max(b.monthly_limit - spent, 0))}</span>
      </div>
    </div>`;
  }).join('') || '<div class="card empty-state" style="text-align:center;padding:40px;"><p>No budgets set. Add a budget to track spending!</p></div>';

  const content = `
    <header class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div><h2 class="page-title">Budgets</h2><p class="page-subtitle">Set monthly spending limits by category.</p></div>
      <button onclick="openModal('addBudgetModal')" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Add Budget
      </button>
    </header>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:24px;">
      ${budgetCards}
    </div>

    <!-- Add Budget Modal -->
    <div id="addBudgetModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Budget</h3>
          <button class="modal-close" onclick="closeModal('addBudgetModal')">✕</button>
        </div>
        <form method="POST" action="/budget">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" name="category" list="budgetCats" required class="form-control" placeholder="Select or type…">
            <datalist id="budgetCats">${categories.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Limit (SAR)</label>
            <input type="number" name="monthly_limit" step="0.01" min="1" required class="form-control" placeholder="e.g. 1000">
          </div>
          <div class="form-group">
            <label class="form-label">Alert at (%)</label>
            <input type="number" name="alert_threshold" value="80" min="10" max="100" class="form-control">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Budget</button>
        </form>
      </div>
    </div>`;

  return baseLayout({ title: 'Budgets', activePage: 'budgets', content, user, flash });
}
