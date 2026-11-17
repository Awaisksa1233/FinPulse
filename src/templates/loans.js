import { baseLayout, esc, fmt } from './base.js';

export function loansPage({ user, loans = [], entriesMap = {}, flash = [] }) {
  const loanCards = loans.map(loan => {
    const entries = entriesMap[loan.id] || [];
    const totalLent = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const totalRepaid = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    const outstanding = totalLent - totalRepaid;
    const isSettled = outstanding <= 0 && entries.length > 0;

    const entryRows = entries.slice(0, 5).map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <span style="color:var(--text-muted);">${esc(e.date || '')}</span>
        <span style="color:var(--text);font-weight:500;">${esc(e.note || '—')}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:700;color:${e.amount > 0 ? 'var(--red-600)' : 'var(--green-600)'};">
            ${e.amount > 0 ? '+' : '-'}SAR ${fmt(Math.abs(e.amount))}
          </span>
          <form method="POST" action="/loan/${loan.id}/entry/${e.id}/delete" onsubmit="return confirm('Delete this entry?')" style="margin:0;">
            <button type="submit" class="btn-ghost" style="padding:2px 6px;border-radius:4px;color:var(--text-light);cursor:pointer;" title="Delete entry">✕</button>
          </form>
        </div>
      </div>`).join('');

    return `
    <div class="card ${outstanding > 0 ? 'card-accent-amber' : 'card-accent-green'}" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h3 style="font-weight:700;font-size:17px;margin:0;color:var(--text);">${esc(loan.person_name)}</h3>
            <span class="badge ${outstanding > 0 ? 'badge-warning' : isSettled ? 'badge-success' : 'badge-primary'}">
              ${outstanding > 0 ? 'Outstanding' : isSettled ? 'Settled' : 'Active'}
            </span>
          </div>
          ${loan.description ? `<p style="font-size:12.5px;color:var(--text-muted);margin:4px 0 0;">${esc(loan.description)}</p>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="text-align:right;">
            <span style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;display:block;">Balance</span>
            <span style="font-size:16px;font-weight:800;color:${outstanding > 0 ? 'var(--red-600)' : 'var(--green-600)'};">
              ${outstanding > 0 ? 'Owes SAR ' + fmt(outstanding) : 'Settled'}
            </span>
          </div>
          <form method="POST" action="/loan/${loan.id}/delete" onsubmit="return confirm('Delete ${esc(loan.person_name)} loan record? All entry history will be deleted.')" style="margin:0;">
            <button type="submit" class="btn-ghost" style="padding:6px;border-radius:6px;color:var(--text-light);cursor:pointer;" title="Delete loan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </form>
        </div>
      </div>

      <!-- Stats Summary -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="background:var(--slate-50);border-radius:var(--r);padding:12px;text-align:center;">
          <p style="font-size:11px;color:var(--text-muted);margin:0;text-transform:uppercase;letter-spacing:.5px;">Total Lent</p>
          <p style="font-weight:800;color:var(--red-600);margin:4px 0 0;font-size:15px;">SAR ${fmt(totalLent)}</p>
        </div>
        <div style="background:var(--slate-50);border-radius:var(--r);padding:12px;text-align:center;">
          <p style="font-size:11px;color:var(--text-muted);margin:0;text-transform:uppercase;letter-spacing:.5px;">Repaid</p>
          <p style="font-weight:800;color:var(--green-600);margin:4px 0 0;font-size:15px;">SAR ${fmt(totalRepaid)}</p>
        </div>
        <div style="background:var(--slate-50);border-radius:var(--r);padding:12px;text-align:center;">
          <p style="font-size:11px;color:var(--text-muted);margin:0;text-transform:uppercase;letter-spacing:.5px;">Remaining</p>
          <p style="font-weight:800;color:${outstanding > 0 ? 'var(--amber-500)' : 'var(--text)'};margin:4px 0 0;font-size:15px;">SAR ${fmt(outstanding)}</p>
        </div>
      </div>

      <!-- Recent Entries List -->
      <div style="margin-bottom:14px;">
        <h4 style="font-size:13px;font-weight:700;color:var(--text-muted);margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Entry History</h4>
        ${entryRows || '<p style="font-size:13px;color:var(--text-light);margin:0;padding:8px 0;">No entries recorded yet.</p>'}
      </div>

      <!-- Expandable Add Entry Form -->
      <details style="margin-top:10px;background:var(--slate-50);border-radius:var(--r);padding:12px 14px;">
        <summary style="font-size:13px;color:var(--blue-600);cursor:pointer;font-weight:600;user-select:none;">
          + Record Lent or Repayment Entry
        </summary>
        <form method="POST" action="/loan/${loan.id}/entry" style="margin-top:14px;display:grid;grid-template-columns:120px 1fr 1fr auto;gap:10px;align-items:end;">
          <div>
            <label class="form-label" style="font-size:11px;">Type</label>
            <select name="entry_type" class="form-control" style="font-size:13px;">
              <option value="lent">Lent (+)</option>
              <option value="repaid">Repaid (−)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:11px;">Amount (SAR)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" style="font-size:13px;" placeholder="0.00">
          </div>
          <div>
            <label class="form-label" style="font-size:11px;">Note (optional)</label>
            <input type="text" name="note" class="form-control" style="font-size:13px;" placeholder="e.g. Dinner share">
          </div>
          <button type="submit" class="btn btn-primary" style="font-size:13px;padding:9px 16px;">Record</button>
        </form>
      </details>
    </div>`;
  }).join('') || `<div class="card empty-state" style="text-align:center;padding:48px 24px;"><p style="color:var(--text-light);margin-bottom:14px;">No loan or debt accounts. Keep track of money lent to friends, family, or colleagues!</p><button onclick="openModal('addLoanModal')" class="btn btn-primary btn-sm">Add First Loan Contact</button></div>`;

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Loans & Receivables</h2>
        <p class="page-subtitle">Track money you lend to others, partial repayments, and settled balances.</p>
      </div>
      <button onclick="openModal('addLoanModal')" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Loan Contact
      </button>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      ${loanCards}
    </div>

    <!-- Add Loan Modal -->
    <div id="addLoanModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Loan Contact</h3>
          <button class="modal-close" onclick="closeModal('addLoanModal')">✕</button>
        </div>
        <form method="POST" action="/loan">
          <div class="form-group">
            <label class="form-label">Person / Entity Name</label>
            <input type="text" name="person_name" required class="form-control" placeholder="e.g. Ahmed, Sarah, Office Team">
          </div>
          <div class="form-group">
            <label class="form-label">Description (optional)</label>
            <input type="text" name="description" class="form-control" placeholder="e.g. Trip expenses, Personal loan">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Create Loan Record</button>
        </form>
      </div>
    </div>`;

  return baseLayout({
    title: 'Loans & Debts',
    activePage: 'loans',
    content,
    user,
    flash
  });
}
