// Base HTML layout — matches FinPulse design tokens and native Cloudflare Workers shell

export function baseLayout({ title, activePage, content, scripts = '', user, flash = [] }) {
  const flashHtml = flash.length ? `
    <div class="toast-container" id="toastContainer">
      ${flash.map(f => {
        const isErr = f.category === 'error' || f.type === 'error';
        return `
        <div class="toast ${isErr ? 'error' : 'success'}">
          <div class="toast-icon">${isErr ? '✕' : '✓'}</div>
          <span class="toast-message">${esc(f.message)}</span>
          <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Close">×</button>
        </div>`;
      }).join('')}
    </div>` : '';

  const navSections = [
    {
      label: 'Overview',
      items: [
        { href: '/', icon: dashIcon, label: 'Dashboard', page: 'dashboard' },
        { href: '/reports', icon: reportIcon, label: 'Reports', page: 'reports' },
        { href: '/chat', icon: chatIcon, label: 'AI Assistant', page: 'chat' },
      ]
    },
    {
      label: 'Finances',
      items: [
        { href: '/income', icon: incomeIcon, label: 'Income', page: 'income' },
        { href: '/expenses', icon: expenseIcon, label: 'Expenses', page: 'expenses' },
        { href: '/recurring', icon: recurringIcon, label: 'Recurring', page: 'recurring' },
        { href: '/accounts', icon: accountIcon, label: 'Accounts', page: 'accounts' },
      ]
    },
    {
      label: 'Planning',
      items: [
        { href: '/budgets', icon: budgetIcon, label: 'Budgets', page: 'budgets' },
        { href: '/loans', icon: loanIcon, label: 'Loans & Debts', page: 'loans' },
      ]
    },
    {
      label: 'Integrations',
      items: [
        { href: '/telegram', icon: tgIcon, label: 'Telegram', page: 'telegram' },
        { href: '/shortcut', icon: shortcutIcon, label: 'iOS Shortcuts', page: 'shortcut' },
      ]
    },
    {
      label: 'Preferences',
      items: [
        { href: '/settings', icon: settingsIcon, label: 'Settings', page: 'settings' },
      ]
    }
  ];

  if (user?.is_admin) {
    navSections.push({
      label: 'System',
      items: [
        { href: '/admin', icon: adminIcon, label: 'Admin Panel', page: 'admin' },
      ]
    });
  }

  const sideNav = navSections.map(sec => `
    <span class="nav-section-label">${sec.label}</span>
    ${sec.items.map(n => `
      <a href="${n.href}" class="nav-link ${activePage === n.page ? 'active' : ''}">
        ${n.icon}
        <span>${n.label}</span>
      </a>
    `).join('')}
  `).join('');

  const bottomNavHtml = `
    <a href="/" class="bottom-nav-link ${activePage === 'dashboard' ? 'active' : ''}">
      ${dashIcon}
      <span>Home</span>
    </a>
    <a href="/expenses" class="bottom-nav-link ${activePage === 'expenses' || activePage === 'income' ? 'active' : ''}">
      ${expenseIcon}
      <span>Activity</span>
    </a>
    <div class="bottom-nav-center-wrap">
      <button class="bottom-nav-center-btn" onclick="openQuickAddSheet('expense')" aria-label="Quick Add Transaction">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    <a href="/chat" class="bottom-nav-link ${activePage === 'chat' ? 'active' : ''}">
      ${chatIcon}
      <span>AI Advisor</span>
    </a>
    <a href="/budgets" class="bottom-nav-link ${activePage === 'budgets' ? 'active' : ''}">
      ${budgetIcon}
      <span>Budgets</span>
    </a>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${esc(title)} - FinPulse</title>
  <meta name="description" content="FinPulse - Intelligent Personal Finance Dashboard">
  <link rel="stylesheet" href="/static/style.css">
  <link rel="manifest" href="/static/manifest.json">
  <meta name="theme-color" content="#1d4ed8">
  <link rel="apple-touch-icon" href="/static/icons/icon-180.png">
  <link rel="apple-touch-icon" sizes="152x152" href="/static/icons/icon-152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/static/icons/icon-180.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/static/icons/icon-192.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
  <!-- PWA Loading Screen -->
  <div id="pwaLoader" class="pwa-loading-screen">
    <div class="pwa-loading-content">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 32px rgba(37,99,235,.5);color:white;font-weight:800;font-size:28px;">F</div>
      <div class="pwa-loading-spinner"></div>
    </div>
  </div>

  ${flashHtml}

  <!-- Mobile Header -->
  <header class="mobile-header">
    <div class="mobile-logo">
      <div style="width:30px;height:30px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;flex-shrink:0;box-shadow:0 2px 8px rgba(37,99,235,.4);">F</div>
      <span class="mobile-logo-text">FinPulse</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <button class="mobile-header-btn" onclick="togglePrivacy()" title="Toggle Privacy Mode" aria-label="Toggle Privacy">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <a href="/chat" class="mobile-header-btn" title="AI Assistant">
        ${chatIcon}
      </a>
      <button class="hamburger-btn" id="hamburgerBtn" onclick="toggleSidebar()" aria-label="Toggle navigation">
        <div class="hamburger-icon">
          <span></span><span></span><span></span>
        </div>
      </button>
    </div>
  </header>

  <!-- Sidebar Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <div class="app-container">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:17px;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,.5);">F</div>
          <span class="sidebar-title">FinPulse</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${sideNav}
      </nav>
      <div class="sidebar-user">
        <div class="user-info">
          <div class="user-avatar">${esc((user?.full_name || user?.name || user?.email || 'U').charAt(0).toUpperCase())}</div>
          <div class="user-details">
            <span class="user-name">${esc(user?.full_name || user?.name || user?.email?.split('@')[0] || 'User')}</span>
            <span class="user-email">${esc(user?.email || '')}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <a href="/settings" class="btn-logout" title="Settings" style="color:var(--sidebar-text);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </a>
          <a href="/logout" class="btn-logout" title="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </a>
        </div>
      </div>
    </aside>

    <main class="main-content">
      ${content}
    </main>
  </div>

  <!-- Bottom Nav (mobile) -->
  <nav class="bottom-nav">
    <div class="bottom-nav-items">
      ${bottomNavHtml}
    </div>
  </nav>

  <!-- Quick Add Sliding Bottom Sheet -->
  <div class="sheet-overlay" id="quickAddOverlay" onclick="closeQuickAddSheet()"></div>
  <div class="bottom-sheet" id="quickAddSheet">
    <div class="sheet-handle"></div>
    <div class="sheet-header-row">
      <div class="sheet-type-pills">
        <button id="qaExpenseBtn" onclick="setQaType('expense')" class="sheet-type-btn active expense">Expense</button>
        <button id="qaIncomeBtn" onclick="setQaType('income')" class="sheet-type-btn">Income</button>
      </div>
      <button onclick="closeQuickAddSheet()" class="sheet-close-btn" aria-label="Close">✕</button>
    </div>

    <div class="qa-display-wrap">
      <div class="qa-display-label">Amount (SAR)</div>
      <div class="qa-amount-val">
        <span style="opacity:0.6;font-size:22px;">SAR</span>
        <span id="qaDisplay">0.00</span>
      </div>
    </div>

    <!-- Quick Category Chips -->
    <div class="qa-cats-scroll" id="qaCatScroll">
      <button type="button" onclick="selectQaCat('Food & Dining')" class="qa-cat-chip active">🍔 Food & Dining</button>
      <button type="button" onclick="selectQaCat('Transport')" class="qa-cat-chip">🚕 Transport</button>
      <button type="button" onclick="selectQaCat('Shopping')" class="qa-cat-chip">🛍️ Shopping</button>
      <button type="button" onclick="selectQaCat('Bills')" class="qa-cat-chip">💡 Bills & Utilities</button>
      <button type="button" onclick="selectQaCat('Groceries')" class="qa-cat-chip">🛒 Groceries</button>
      <button type="button" onclick="selectQaCat('Entertainment')" class="qa-cat-chip">🍿 Entertainment</button>
      <button type="button" onclick="selectQaCat('Health')" class="qa-cat-chip">💊 Health</button>
      <button type="button" onclick="selectQaCat('Other')" class="qa-cat-chip">💳 Other</button>
    </div>

    <!-- Tactile Numpad Grid -->
    <div class="qa-numpad">
      <button type="button" onclick="qaNum('1')" class="qa-key">1</button>
      <button type="button" onclick="qaNum('2')" class="qa-key">2</button>
      <button type="button" onclick="qaNum('3')" class="qa-key">3</button>
      <button type="button" onclick="qaNum('4')" class="qa-key">4</button>
      <button type="button" onclick="qaNum('5')" class="qa-key">5</button>
      <button type="button" onclick="qaNum('6')" class="qa-key">6</button>
      <button type="button" onclick="qaNum('7')" class="qa-key">7</button>
      <button type="button" onclick="qaNum('8')" class="qa-key">8</button>
      <button type="button" onclick="qaNum('9')" class="qa-key">9</button>
      <button type="button" onclick="qaNum('.')" class="qa-key">.</button>
      <button type="button" onclick="qaNum('0')" class="qa-key">0</button>
      <button type="button" onclick="qaDel()" class="qa-key" aria-label="Backspace">⌫</button>
    </div>

    <button type="button" id="qaSubmitBtn" onclick="qaCommit()" class="qa-submit-btn">
      Save Transaction
    </button>
  </div>

  <!-- Floating Action Button (FAB) Speed Dial -->
  <div class="fab-container" id="fabContainer">
    <div class="fab-menu" id="fabMenu">
      <a href="/expenses" class="fab-item" style="--i:1;">
        <span class="fab-label">Add Expense</span>
        <div class="fab-icon danger">${expenseIcon}</div>
      </a>
      <a href="/income" class="fab-item" style="--i:2;">
        <span class="fab-label">Add Income</span>
        <div class="fab-icon success">${incomeIcon}</div>
      </a>
      <a href="/chat" class="fab-item" style="--i:3;">
        <span class="fab-label">AI Chat</span>
        <div class="fab-icon primary">${chatIcon}</div>
      </a>
    </div>
    <button class="fab-btn" id="fabMain" onclick="toggleFab()" aria-label="Quick Actions">
      <svg id="fabIcon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition:transform .25s ease;">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>

  <script>
    // Haptic feedback helper (subtle mobile vibrations)
    function haptic(ms = 10) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(ms); } catch(e) {}
      }
    }

    // Privacy Masking
    function togglePrivacy() {
      haptic(15);
      const isMasked = document.body.classList.toggle('privacy-masked');
      try {
        localStorage.setItem('finpulse_privacy', isMasked ? '1' : '0');
      } catch(e) {}
    }
    // Initialize privacy from storage
    if (typeof localStorage !== 'undefined' && localStorage.getItem('finpulse_privacy') === '1') {
      document.body.classList.add('privacy-masked');
    }

    // Quick Add Sliding Bottom Sheet
    let _qaType = 'expense';
    let _qaNumStr = '';
    let _qaCategory = 'Food & Dining';

    function openQuickAddSheet(type = 'expense') {
      haptic(12);
      setQaType(type);
      _qaNumStr = '';
      _updateQaDisplay();
      const overlay = document.getElementById('quickAddOverlay');
      const sheet = document.getElementById('quickAddSheet');
      if (overlay && sheet) {
        overlay.classList.add('active');
        sheet.classList.add('open');
      }
    }

    function closeQuickAddSheet() {
      const overlay = document.getElementById('quickAddOverlay');
      const sheet = document.getElementById('quickAddSheet');
      if (overlay && sheet) {
        overlay.classList.remove('active');
        sheet.classList.remove('open');
      }
    }

    function setQaType(type) {
      haptic(8);
      _qaType = type;
      const expBtn = document.getElementById('qaExpenseBtn');
      const incBtn = document.getElementById('qaIncomeBtn');
      if (expBtn && incBtn) {
        if (type === 'expense') {
          expBtn.className = 'sheet-type-btn active expense';
          incBtn.className = 'sheet-type-btn';
        } else {
          incBtn.className = 'sheet-type-btn active income';
          expBtn.className = 'sheet-type-btn';
        }
      }
    }

    function selectQaCat(cat) {
      haptic(6);
      _qaCategory = cat;
      document.querySelectorAll('.qa-cat-chip').forEach(c => {
        if (c.textContent.includes(cat)) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    }

    function qaNum(char) {
      haptic(8);
      if (char === '.' && _qaNumStr.includes('.')) return;
      if (_qaNumStr.length >= 8) return;
      _qaNumStr += char;
      _updateQaDisplay();
    }

    function qaDel() {
      haptic(8);
      _qaNumStr = _qaNumStr.slice(0, -1);
      _updateQaDisplay();
    }

    function _updateQaDisplay() {
      const el = document.getElementById('qaDisplay');
      if (el) el.textContent = _qaNumStr || '0.00';
    }

    async function qaCommit() {
      haptic(15);
      const val = parseFloat(_qaNumStr);
      if (!val || isNaN(val) || val <= 0) {
        alert('Please enter a valid amount.');
        return;
      }
      const btn = document.getElementById('qaSubmitBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      }
      try {
        const res = await fetch('/api/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: _qaType,
            amount: val,
            category: _qaCategory,
            date: new Date().toISOString().split('T')[0]
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeQuickAddSheet();
          window.location.reload();
        } else {
          alert(data.error || 'Failed to save transaction');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save Transaction';
          }
        }
      } catch (err) {
        alert('Error saving transaction: ' + err.message);
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Save Transaction';
        }
      }
    }

    // Sidebar toggle
    function toggleSidebar() {
      const s = document.getElementById('sidebar');
      const o = document.getElementById('sidebarOverlay');
      const btn = document.getElementById('hamburgerBtn');
      s.classList.toggle('open');
      o.classList.toggle('active');
      if (btn) btn.classList.toggle('active');
    }

    // FAB toggle
    function toggleFab() {
      const c = document.getElementById('fabContainer');
      const icon = document.getElementById('fabIcon');
      c.classList.toggle('active');
      if (icon) {
        icon.style.transform = c.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
      }
    }
    document.addEventListener('click', e => {
      const c = document.getElementById('fabContainer');
      if (c && !c.contains(e.target)) {
        c.classList.remove('active');
        const icon = document.getElementById('fabIcon');
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    });

    // Modal scroll-lock helpers (iOS PWA safe)
    let _scrollY = 0;
    function openModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      _scrollY = window.scrollY || window.pageYOffset;
      document.documentElement.style.setProperty('--scroll-y', '-' + _scrollY + 'px');
      document.body.classList.add('modal-open');
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.style.opacity = '1');
    }
    function closeModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('--scroll-y');
      window.scrollTo(0, _scrollY);
    }
    document.addEventListener('click', e => {
      if (e.target.classList.contains('modal-backdrop')) {
        closeModal(e.target.id);
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => closeModal(m.id));
      }
    });

    // Auto-dismiss toasts
    document.querySelectorAll('.toast').forEach(toast => {
      setTimeout(() => {
        toast.style.animation = 'toastSlideOut .35s ease forwards';
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    });

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
const iconProps = `width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
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
export const adminIcon  = `<svg ${iconProps}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7 7 0 0 1 11 3.07V3a1 1 0 0 1 2 0v.07A7 7 0 0 1 18.93 9H19a1 1 0 0 1 0 2h-.07A7 7 0 0 1 13 16.93z"/></svg>`;
export const settingsIcon = `<svg ${iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
export const shortcutIcon = `<svg ${iconProps}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

// ── HTML escaping ─────────────────────────────────────────────────────────────
export function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function fmt(num, dec = 2) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
