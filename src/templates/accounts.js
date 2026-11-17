import { baseLayout, esc, fmt } from './base.js';

function logoUrl(name) {
  const domainMap = {
    'snb': 'alahli.com', 'ahli': 'alahli.com', 'rajhi': 'alrajhibank.com.sa',
    'riyad': 'riyadbank.com', 'stc': 'stcpay.com.sa', 'd360': 'd360bank.com',
    'urpay': 'urpay.com', 'alinma': 'alinma.com', 'sab': 'sab.com',
    'albilad': 'bankalbilad.com.sa', 'mobily': 'mobilypay.sa', 'tiqmo': 'tiqmo.com',
  };
  const lower = (name || '').toLowerCase();
  for (const [key, domain] of Object.entries(domainMap)) {
    if (lower.includes(key)) return `https://logo.clearbit.com/${domain}`;
  }
  return null;
}

export function accountsPage({ user, accounts, flash }) {
  const accountCards = accounts.map(a => {
    const bg = a.type === 'bank'
      ? 'linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)'
      : a.type === 'mobile'
        ? 'linear-gradient(135deg,#6a11cb 0%,#2575fc 100%)'
        : 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)';
    const logo = logoUrl(a.name);
    const iconSvg = a.type === 'bank'
      ? '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'
      : a.type === 'mobile'
        ? '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'
        : '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>';

    return `
    <div class="account-card" style="background:${bg};color:white;border-radius:20px;padding:24px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;min-height:200px;border:1px solid rgba(255,255,255,.1);box-shadow:var(--shadow-lg);">
      <div style="position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none;"></div>
      <div style="position:absolute;left:-20px;bottom:-40px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;"></div>
      <div class="account-header" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${logo ? `<img src="${logo}" alt="${esc(a.name)}" style="width:100%;height:100%;object-fit:cover;background:white;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg></div>` : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg>`}
          </div>
          <div>
            <p style="color:white;font-weight:700;font-size:17px;margin:0;">${esc(a.name)}</p>
            <p style="color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:0;">${esc(a.type)}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="editAccount(${a.id},'${esc(a.name)}','${a.type}','${esc(a.currency)}',${a.balance})"
            style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.15);color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <form method="POST" action="/account/${a.id}/delete" onsubmit="return confirm('Delete this account?')" style="display:inline;">
            <button type="submit" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.15);color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </form>
        </div>
      </div>
      <div style="margin-top:auto;">
        <p style="color:white;font-size:26px;font-weight:800;margin:0;">SAR ${fmt(a.balance)}</p>
        <p style="color:rgba(255,255,255,.75);font-size:11px;margin:0;letter-spacing:.5px;">Available Balance • ${esc(a.currency)}</p>
      </div>
    </div>`;
  }).join('') || `<div class="card empty-state" style="grid-column:1/-1;text-align:center;padding:40px;"><p>No accounts yet. Add your first account!</p></div>`;

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)} (SAR ${fmt(a.balance)})</option>`).join('');
  const saudiBanks = ['SNB (AlAhli)','Al Rajhi Bank','Riyad Bank','STC Pay (Main)','STC Pay (Savings)','D360','Urpay','Alinma Bank','SAB (Saudi Awwal Bank)','Bank Albilad','Mobily Pay','Tiqmo','Cash Wallet'];

  const content = `
    <header class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div><h2 class="page-title">Accounts & Wallets</h2><p class="page-subtitle">Manage where your money sits.</p></div>
      <button onclick="openModal('addAccountModal')" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Add Account
      </button>
    </header>

    <div class="account-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:24px;">
      ${accountCards}
    </div>

    <!-- Quick Transfer -->
    <div class="card" style="max-width:700px;">
      <h3 class="card-title" style="margin-bottom:16px;">Quick Transfer</h3>
      <form method="POST" action="/transfer" style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">
          <label class="form-label">From</label>
          <select name="from_id" required class="form-control"><option value="">Select Source</option>${accountOptions}</select>
        </div>
        <div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">
          <label class="form-label">To</label>
          <select name="to_id" required class="form-control"><option value="">Select Dest.</option>${accountOptions}</select>
        </div>
        <div class="form-group" style="width:140px;margin-bottom:0;">
          <label class="form-label">Amount (SAR)</label>
          <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" placeholder="0.00">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Date</label>
          <input type="date" name="date" value="${new Date().toISOString().slice(0,10)}" class="form-control">
        </div>
        <button type="submit" class="btn btn-primary">Transfer</button>
      </form>
    </div>

    <!-- Add Account Modal -->
    <div id="addAccountModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Account</h3>
          <button class="modal-close" onclick="closeModal('addAccountModal')">✕</button>
        </div>
        <form method="POST" action="/account">
          <div class="form-group">
            <label class="form-label">Account Name</label>
            <input type="text" name="name" required class="form-control" placeholder="e.g. SNB, STC Pay, D360" list="saudiBanks">
            <datalist id="saudiBanks">${saudiBanks.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select name="type" class="form-control"><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile">Mobile Wallet</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Currency</label>
              <input type="text" name="currency" value="SAR" class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Current Balance</label>
            <input type="number" name="balance" step="0.01" value="0" required class="form-control" placeholder="0.00">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Account</button>
        </form>
      </div>
    </div>

    <!-- Edit Account Modal -->
    <div id="editAccountModal" class="modal-backdrop" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Edit Account</h3>
          <button class="modal-close" onclick="closeModal('editAccountModal')">✕</button>
        </div>
        <form method="POST" action="/account/edit">
          <input type="hidden" name="id" id="editAccountId">
          <div class="form-group"><label class="form-label">Account Name</label><input type="text" name="name" id="editAccountName" required class="form-control" list="saudiBanks"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Type</label><select name="type" id="editAccountType" class="form-control"><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile">Mobile Wallet</option></select></div>
            <div class="form-group"><label class="form-label">Currency</label><input type="text" name="currency" id="editAccountCurrency" class="form-control"></div>
          </div>
          <div class="form-group"><label class="form-label">Current Balance</label><input type="number" name="balance" id="editAccountBalance" step="0.01" required class="form-control"></div>
          <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
        </form>
      </div>
    </div>`;

  return baseLayout({
    title: 'Accounts', activePage: 'accounts', content, user, flash,
    scripts: `<script>
      function editAccount(id, name, type, currency, balance) {
        document.getElementById('editAccountId').value = id;
        document.getElementById('editAccountName').value = name;
        document.getElementById('editAccountType').value = type;
        document.getElementById('editAccountCurrency').value = currency;
        document.getElementById('editAccountBalance').value = balance;
        openModal('editAccountModal');
      }
    </script>`
  });
}
