import { baseLayout, esc, fmt } from './base.js';

export function loansPage({ user, loans, entriesMap, flash }) {
  const loanCards = loans.map(loan => {
    const entries = entriesMap[loan.id] || [];
    const totalLent = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const totalRepaid = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    const outstanding = totalLent - totalRepaid;

    const entryRows = entries.slice(0, 5).map(e => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px;">
        <span style="color:var(--gray-600);">${esc(e.date || '')}</span>
        <span style="color:var(--gray-700);">${esc(e.note || '—')}</span>
        <span style="font-weight:600;color:${e.amount > 0 ? '#dc2626' : '#16a34a'};">${e.amount > 0 ? '+' : ''}SAR ${fmt(Math.abs(e.amount))}</span>
        <form method="POST" action="/loan/${loan.id}/entry/${e.id}/delete" onsubmit="return confirm('Delete entry?')" style="display:inline;">
          <button type="submit" style="background:none;border:none;color:var(--gray-300);cursor:pointer;padding:0 4px;">✕</button>
        </form>
      </div>`).join('');

    return `
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <p style="font-weight:700;font-size:17px;margin:0;">${esc(loan.person_name)}</p>
          <p style="font-size:13px;color:var(--gray-500);margin:0;">${esc(loan.description || '')}</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;font-weight:700;color:${outstanding > 0 ? '#dc2626' : '#16a34a'};">
            ${outstanding > 0 ? `Owes SAR ${fmt(outstanding)}` : 'Settled'}
          </span>
          <form method="POST" action="/loan/${loan.id}/delete" onsubmit="return confirm('Delete this loan account? All entries will be lost.')" style="display:inline;">
            <button type="submit" style="background:none;border:none;color:var(--gray-400);cursor:pointer;padding:4px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </form>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="background:var(--gray-50);border-radius:8px;padding:12px;text-align:center;">
          <p style="font-size:12px;color:var(--gray-500);margin:0;">Total Lent</p>
          <p style="font-weight:700;color:#dc2626;margin:0;">SAR ${fmt(totalLent)}</p>
        </div>
        <div style="background:var(--gray-50);border-radius:8px;padding:12px;text-align:center;">
          <p style="font-size:12px;color:var(--gray-500);margin:0;">Repaid</p>
          <p style="font-weight:700;color:#16a34a;margin:0;">SAR ${fmt(totalRepaid)}</p>
        </div>
        <div style="background:var(--gray-50);border-radius:8px;padding:12px;text-align:center;">
          <p style="font-size:12px;color:var(--gray-500);margin:0;">Outstanding</p>
          <p style="font-weight:700;color:${outstanding > 0 ? '#dc2626' : 'var(--gray-700)'};margin:0;">SAR ${fmt(outstanding)}</p>
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <h4 style="font-size:13px;font-weight:600;color:var(--gray-600);margin:0 0 8px;">Recent Entries</h4>
        ${entryRows || '<p style="font-size:13px;color:var(--gray-400);margin:0;">No entries yet.</p>'}
      </div>

      <details style="margin-top:8px;">
        <summary style="font-size:13px;color:var(--primary);cursor:pointer;font-weight:600;">Add Entry</summary>
        <form method="POST" action="/loan/${loan.id}/entry" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;">
          <div>
            <label style="font-size:12px;color:var(--gray-600);">Type</label>
            <select name="entry_type" class="form-control" style="font-size:13px;">
              <option value="lent">Lent (+)</option>
              <option value="repaid">Repaid (−)</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;color:var(--gray-600);">Amount (SAR)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" style="font-size:13px;">
          </div>
          <div>
            <label style="font-size:12px;color:var(--gray-600);">Note</label>
            <input type="text" name="note" class="form-control" style="font-size:13px;" placeholder="Optional">
          </div>
          <button type="submit" class="btn btn-primary" style="font-size:13px;padding:8px 12px;">Add</button>
        </form>
      </details>
    </div>`;
  }).join('') || '<div class="card empty-state" style="text-align:center;padding:40px;"><p>No loan accounts. Track money you lend to friends and family.</p></div>';

  const content = `
    <header class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div><h2 class="page-title">Loans</h2><p class="page-subtitle">Track money you lend to others.</p></div>
      <button onclick="openModal('addLoanModal')" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        New Loan
      </button>
    </header>

    ${loanCards}

    <!-- Add Loan Modal -->
    <div id="addLoanModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Loan Account</h3>
          <button class="modal-close" onclick="closeModal('addLoanModal')">✕</button>
        </div>
        <form method="POST" action="/loan">
          <div class="form-group">
            <label class="form-label">Person Name</label>
            <input type="text" name="person_name" required class="form-control" placeholder="Who did you lend to?">
          </div>
          <div class="form-group">
            <label class="form-label">Description (optional)</label>
            <input type="text" name="description" class="form-control" placeholder="e.g. For car repair">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Create</button>
        </form>
      </div>
    </div>`;

  return baseLayout({ title: 'Loans', activePage: 'loans', content, user, flash });
}
