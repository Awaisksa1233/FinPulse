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

export function accountsPage({ user, accounts = [], flash = [] }) {
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const accountCards = accounts.map(a => {
    const isBank = a.type === 'bank';
    const isMobile = a.type === 'mobile';
    const bg = isBank
      ? 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%)'
      : isMobile
        ? 'linear-gradient(135deg,#1e1b4b 0%,#4338ca 60%,#6366f1 100%)'
        : 'linear-gradient(135deg,#064e3b 0%,#0d9488 60%,#10b981 100%)';
    const logo = logoUrl(a.name);
    const iconSvg = isBank
      ? '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'
      : isMobile
        ? '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'
        : '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>';

    return `
    <div class="account-card" style="background:${bg};color:white;border-radius:20px;padding:24px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;min-height:200px;border:1px solid rgba(255,255,255,.12);box-shadow:var(--shadow-lg);">
      <div style="position:absolute;right:-40px;top:-40px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none;"></div>
      <div style="position:absolute;left:-30px;bottom:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none;"></div>
      
      <!-- Card Top: Brand & Actions -->
      <div class="account-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;position:relative;z-index:1;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${logo ? `<img src="${logo}" alt="${esc(a.name)}" style="width:100%;height:100%;object-fit:cover;background:white;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg></div>` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${iconSvg}</svg>`}
          </div>
          <div>
            <p style="color:white;font-weight:700;font-size:16px;margin:0;">${esc(a.name)}</p>
            <p style="color:rgba(255,255,255,.75);font-size:11px;text-transform:uppercase;letter-spacing:.6px;margin:2px 0 0;">${esc(a.type)}</p>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <button onclick="editAccount(${a.id},'${esc(a.name)}','${a.type}','${esc(a.currency || 'SAR')}',${a.balance})"
            style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);color:white;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;" title="Edit account">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <form method="POST" action="/account/${a.id}/delete" onsubmit="return confirm('Delete account ${esc(a.name)}? Transactions tied to it will remain.')" style="margin:0;">
            <button type="submit" style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);color:white;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;" title="Delete account">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </form>
        </div>
      </div>

      <!-- Card Bottom: Balance -->
      <div style="margin-top:auto;position:relative;z-index:1;">
        <p style="color:rgba(255,255,255,.65);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Available Balance</p>
        <p style="color:white;font-size:28px;font-weight:900;letter-spacing:-0.8px;margin:0;">SAR ${fmt(a.balance)}</p>
      </div>
    </div>`;
  }).join('') || `<div class="card empty-state" style="grid-column:1/-1;text-align:center;padding:48px 24px;"><p style="color:var(--text-light);margin-bottom:14px;">No accounts found. Add your bank, wallet, or cash fund!</p><button onclick="openModal('addAccountModal')" class="btn btn-primary btn-sm">Add First Account</button></div>`;

  const accountOptions = accounts.map(a => `<option value="${a.id}">${esc(a.name)} (SAR ${fmt(a.balance)})</option>`).join('');
  const saudiBanks = ['SNB (AlAhli)', 'Al Rajhi Bank', 'Riyad Bank', 'STC Pay (Main)', 'STC Pay (Savings)', 'D360 Bank', 'Urpay', 'Alinma Bank', 'SAB (Saudi Awwal Bank)', 'Bank Albilad', 'Mobily Pay', 'Tiqmo', 'Cash Wallet'];

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Accounts & Wallets</h2>
        <p class="page-subtitle">Track where your money sits and transfer funds between them.</p>
      </div>
      <button onclick="openModal('addAccountModal')" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Account
      </button>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <!-- Total Balance Strip -->
      <div class="card" style="margin-bottom:24px;padding:18px 24px;background:var(--surface);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <span style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;">Total In All Accounts</span>
            <h3 style="font-size:26px;font-weight:900;color:var(--text);margin:2px 0 0;">SAR ${fmt(totalBalance)}</h3>
          </div>
          <span class="badge badge-primary" style="font-size:13px;padding:6px 12px;">
            ${accounts.length} Account${accounts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <!-- Account Cards Grid -->
      <div class="account-grid" style="margin-bottom:28px;">
        ${accountCards}
      </div>

      <!-- Quick Transfer Card -->
      ${accounts.length >= 2 ? `
      <div class="card card-accent-blue" style="max-width:800px;margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">Quick Internal Transfer</h3>
          <span style="font-size:12px;color:var(--text-muted);">Move money between your own accounts</span>
        </div>
        <form method="POST" action="/transfer" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label class="form-label">Transfer From</label>
            <select name="from_id" required class="form-control">
              <option value="">Select source account…</option>
              ${accountOptions}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Transfer To</label>
            <select name="to_id" required class="form-control">
              <option value="">Select destination account…</option>
              ${accountOptions}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Amount (SAR)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required class="form-control" placeholder="0.00">
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" class="form-control">
          </div>

          <div style="grid-column:1/-1;">
            <button type="submit" class="btn btn-primary" style="width:100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Execute Transfer
            </button>
          </div>
        </form>
      </div>` : ''}
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
            <input type="text" name="name" required class="form-control" placeholder="e.g. SNB, STC Pay, Cash Wallet" list="saudiBanks">
            <datalist id="saudiBanks">${saudiBanks.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Account Type</label>
              <select name="type" class="form-control">
                <option value="bank">Bank Account</option>
                <option value="mobile">Mobile Wallet (STC Pay, Urpay, etc.)</option>
                <option value="cash">Cash Fund</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Currency</label>
              <input type="text" name="currency" value="SAR" class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Starting Balance (SAR)</label>
            <input type="number" name="balance" step="0.01" value="0.00" required class="form-control" placeholder="0.00">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top:14px;">Save Account</button>
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
          <div class="form-group">
            <label class="form-label">Account Name</label>
            <input type="text" name="name" id="editAccountName" required class="form-control" list="saudiBanks">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select name="type" id="editAccountType" class="form-control">
                <option value="bank">Bank Account</option>
                <option value="mobile">Mobile Wallet</option>
                <option value="cash">Cash Fund</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Currency</label>
              <input type="text" name="currency" id="editAccountCurrency" class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Current Balance (SAR)</label>
            <input type="number" name="balance" id="editAccountBalance" step="0.01" required class="form-control">
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top:14px;">Save Changes</button>
        </form>
      </div>
    </div>`;

  const scripts = `
  <script>
    function editAccount(id, name, type, currency, balance) {
      document.getElementById('editAccountId').value = id;
      document.getElementById('editAccountName').value = name;
      document.getElementById('editAccountType').value = type;
      document.getElementById('editAccountCurrency').value = currency || 'SAR';
      document.getElementById('editAccountBalance').value = balance;
      openModal('editAccountModal');
    }
  </script>`;

  return baseLayout({
    title: 'Accounts & Wallets',
    activePage: 'accounts',
    content,
    scripts,
    user,
    flash
  });
}
