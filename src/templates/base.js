// Base HTML layout — matches the existing Flask base.html structure exactly

export function baseLayout({ title, activePage, content, scripts = '', user, flash = [] }) {
  const flashHtml = flash.length ? flash.map(f => `
    <div class="flash ${f.category || 'info'}" style="position:fixed;top:16px;right:16px;z-index:9999;padding:12px 20px;border-radius:10px;background:${f.category === 'error' ? '#dc2626' : '#16a34a'};color:white;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:320px;">${esc(f.message)}</div>
  `).join('') : '';

  const navItems = [
    { href: '/', icon: dashIcon, label: 'Dashboard', page: 'dashboard' },
    { href: '/reports', icon: reportIcon, label: 'Reports', page: 'reports' },
    { href: '/chat', icon: chatIcon, label: 'AI Assistant', page: 'chat' },
    { href: '/income', icon: incomeIcon, label: 'Income', page: 'income' },
    { href: '/expenses', icon: expenseIcon, label: 'Expenses', page: 'expenses' },
    { href: '/recurring', icon: recurringIcon, label: 'Recurring', page: 'recurring' },
    { href: '/accounts', icon: accountIcon, label: 'Accounts', page: 'accounts' },
    { href: '/budgets', icon: budgetIcon, label: 'Budgets', page: 'budgets' },
    { href: '/loans', icon: loanIcon, label: 'Loans & Debts', page: 'loans' },
    { href: '/telegram', icon: tgIcon, label: 'Telegram', page: 'telegram' },
  ];

  const sideNav = navItems.map(n => `
    <a href="${n.href}" class="nav-item ${activePage === n.page ? 'active' : ''}">
      ${n.icon}
      <span>${n.label}</span>
    </a>
  `).join('');

  const bottomNav = [
    { href: '/', icon: dashIcon, label: 'Home', page: 'dashboard' },
    { href: '/expenses', icon: expenseIcon, label: 'Expenses', page: 'expenses' },
    { href: '/chat', icon: chatIcon, label: 'AI', page: 'chat' },
    { href: '/accounts', icon: accountIcon, label: 'Accounts', page: 'accounts' },
    { href: '/reports', icon: reportIcon, label: 'Reports', page: 'reports' },
  ].map(n => `
    <a href="${n.href}" class="bottom-nav-item ${activePage === n.page ? 'active' : ''}">
      ${n.icon}
      <span>${n.label}</span>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} - FinPulse</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="manifest" href="/static/manifest.json">
  <meta name="theme-color" content="#1d4ed8">
  <link rel="apple-touch-icon" href="/static/icons/icon-180.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
<body>
  <!-- PWA Loading Screen -->
  <div id="pwaLoader" style="display:none;position:fixed;inset:0;background:#0f172a;z-index:99999;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
    <div style="width:60px;height:60px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:16px;display:flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:28px;font-weight:700;">F</span>
    </div>
    <div style="color:#94a3b8;font-size:14px;">Loading FinPulse…</div>
  </div>

  ${flashHtml}

  <!-- Mobile Header -->
  <header class="mobile-header">
    <button class="hamburger" id="hamburgerBtn" onclick="toggleSidebar()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="mobile-logo">FinPulse</div>
    <a href="/chat" style="color:var(--gray-500);display:flex;align-items:center;padding:8px;">
      ${chatIcon}
    </a>
  </header>

  <!-- Sidebar Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;flex-shrink:0;">F</div>
          <span style="font-weight:700;font-size:17px;color:var(--gray-900);">FinPulse</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${sideNav}
      </nav>
      <div class="sidebar-footer">
        <div style="padding:12px 16px;border-top:1px solid var(--gray-100);">
          <div style="font-size:13px;font-weight:600;color:var(--gray-900);margin-bottom:2px;">${esc(user?.full_name || user?.name || user?.email?.split('@')[0] || 'User')}</div>
          <div style="font-size:11px;color:var(--gray-500);">${esc(user?.email || '')}</div>
        </div>
        <a href="/logout" style="display:flex;align-items:center;gap:8px;padding:10px 16px;color:var(--gray-500);font-size:13px;text-decoration:none;border-top:1px solid var(--gray-100);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </a>
      </div>
    </aside>

    <main class="main-content">
      ${content}
    </main>
  </div>

  <!-- Bottom Nav (mobile) -->
  <nav class="bottom-nav">
    ${bottomNav}
  </nav>

  <!-- FAB -->
  <div class="fab-container">
    <button class="fab" id="fabMain" onclick="toggleFab()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
    <div class="fab-menu" id="fabMenu" style="display:none;">
      <a href="/expenses" class="fab-item">
        <span class="fab-label">Add Expense</span>
        <div class="fab-btn" style="background:#dc2626;">${expenseIcon}</div>
      </a>
      <a href="/income" class="fab-item">
        <span class="fab-label">Add Income</span>
        <div class="fab-btn" style="background:#16a34a;">${incomeIcon}</div>
      </a>
      <a href="/chat" class="fab-item">
        <span class="fab-label">AI Chat</span>
        <div class="fab-btn" style="background:#2563eb;">${chatIcon}</div>
      </a>
    </div>
  </div>

  <script>
    // Sidebar toggle
    function toggleSidebar() {
      const s = document.getElementById('sidebar');
      const o = document.getElementById('sidebarOverlay');
      s.classList.toggle('open');
      o.classList.toggle('show');
    }

    // FAB toggle
    let fabOpen = false;
    function toggleFab() {
      fabOpen = !fabOpen;
      const menu = document.getElementById('fabMenu');
      menu.style.display = fabOpen ? 'flex' : 'none';
      document.getElementById('fabMain').style.transform = fabOpen ? 'rotate(45deg)' : '';
    }

    // Modal helpers
    function openModal(id) { document.getElementById(id).style.display='flex'; }
    function closeModal(id) { document.getElementById(id).style.display='none'; }
    document.addEventListener('keydown', e => { if(e.key==='Escape') document.querySelectorAll('.modal-backdrop').forEach(m=>m.style.display='none'); });

    // Auto-hide flash messages
    setTimeout(() => { document.querySelectorAll('.flash').forEach(f=>f.remove()); }, 4000);

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/static/sw.js').catch(()=>{});
    }
  </script>
  ${scripts}
</body>
</html>`;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const iconProps = `width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"`;
export const dashIcon   = `<svg ${iconProps}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
export const reportIcon = `<svg ${iconProps}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
export const chatIcon   = `<svg ${iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
export const incomeIcon = `<svg ${iconProps}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
export const expenseIcon= `<svg ${iconProps}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
export const recurringIcon=`<svg ${iconProps}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
export const accountIcon= `<svg ${iconProps}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
export const budgetIcon = `<svg ${iconProps}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
export const loanIcon   = `<svg ${iconProps}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
export const tgIcon     = `<svg ${iconProps}><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.9-.168 1.76.323 2.08.207.137.42.263.656.373a8.54 8.54 0 0 0 1.59.5c.482.117.955.237 1.447.4l.394.14a2.73 2.73 0 0 0 .694.093c.5 0 .981-.145 1.434-.424l.012-.008 4.065-2.826a.5.5 0 0 1 .618.776l-3.374 3.19a1.65 1.65 0 0 0-.494 1.183v.038c0 .18.028.355.082.52l.736 2.252a1.74 1.74 0 0 0 1.657 1.198c.496 0 .966-.2 1.308-.556l1.37-1.432 1.978 1.59c.413.33.907.512 1.414.512a2.21 2.21 0 0 0 2.188-1.902l1.726-9.65a2.242 2.242 0 0 0-2.145-2.63z"/></svg>`;

// ── HTML escaping ─────────────────────────────────────────────────────────────
export function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function fmt(num, dec = 2) {
  return Number(num || 0).toFixed(dec);
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
