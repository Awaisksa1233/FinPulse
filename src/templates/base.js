// FinPulse — Modern Mobile-First Fintech Base Layout
// Clean-slate architecture without legacy baggage

export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmt(num, decimals = 2) {
  const n = parseFloat(num);
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function baseLayout({ title, activePage, content, scripts = '', user, flash = [] }) {
  const userName = esc(user?.full_name || user?.email?.split('@')[0] || 'User');
  const userInitial = (user?.full_name || user?.email || 'U')[0].toUpperCase();

  const flashHtml = flash.length ? `
    <div class="toast-container" id="toastContainer">
      ${flash.map(f => {
        const isErr = f.category === 'error' || f.type === 'error';
        return `
        <div class="toast ${isErr ? 'text-rose-200' : 'text-emerald-200'}" style="background: ${isErr ? 'rgba(159, 18, 57, 0.95)' : 'rgba(6, 78, 59, 0.95)'}; border: 1px solid ${isErr ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'};">
          <div class="flex items-center gap-2">
            <span>${isErr ? '✕' : '✓'}</span>
            <span>${esc(f.message)}</span>
          </div>
          <button onclick="this.closest('.toast').remove()" style="opacity: 0.7; font-size: 16px; cursor: pointer;">×</button>
        </div>`;
      }).join('')}
    </div>` : '';

  const navItems = [
    { href: '/', label: 'Dashboard', page: 'dashboard', icon: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>' },
    { href: '/expenses', label: 'Activity', page: 'expenses', icon: '<path d="M4 6h16M4 12h16M4 18h7"/>' },
    { href: '/chat', label: 'AI Advisor', page: 'chat', icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/>' },
    { href: '/budgets', label: 'Budgets', page: 'budgets', icon: '<path d="M18 20V10M12 20V4M6 20v-6"/>' },
    { href: '/accounts', label: 'Accounts', page: 'accounts', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>' },
    { href: '/reports', label: 'Reports', page: 'reports', icon: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>' },
    { href: '/recurring', label: 'Recurring', page: 'recurring', icon: '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' },
    { href: '/loans', label: 'Loans & Debts', page: 'loans', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    { href: '/telegram', label: 'Telegram Bot', page: 'telegram', icon: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
    { href: '/shortcut', label: 'iOS Shortcut', page: 'shortcut', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
    { href: '/settings', label: 'Settings', page: 'settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' }
  ];

  if (user?.is_admin) {
    navItems.push({ href: '/admin/users', label: 'Admin', page: 'admin', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' });
  }

  const sideNavHtml = navItems.map(item => `
    <a href="${item.href}" class="sidebar-nav-item ${activePage === item.page ? 'active' : ''}">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${item.icon}</svg>
      <span>${item.label}</span>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${esc(title)} - FinPulse</title>
  <meta name="description" content="Intelligent Personal Finance for Modern Living">
  <link rel="stylesheet" href="/static/style.css">
  <link rel="manifest" href="/static/manifest.json">
  <meta name="theme-color" content="#090d16">
  <link rel="apple-touch-icon" href="/static/icons/icon-180.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>

  ${flashHtml}

  <!-- Mobile Viewport Container -->
  <div class="app-viewport">

    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="flex items-center gap-2">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #0d9488); padding: 2px; flex-shrink: 0;">
          <div style="width: 100%; height: 100%; border-radius: 50%; background: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #60a5fa;">
            ${userInitial}
          </div>
        </div>
        <div>
          <p style="font-size: 10px; color: var(--text-muted); line-height: 1;">Welcome back,</p>
          <h2 style="font-size: 13px; font-weight: 700; color: #ffffff; line-height: 1.2;">${userName}</h2>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <button onclick="togglePrivacy()" class="mobile-header-btn" title="Toggle Privacy Mask" aria-label="Toggle Privacy">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button onclick="toggleSidebar()" class="mobile-header-btn" title="Navigation Menu" aria-label="Open Menu">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </header>

    <!-- Main Dynamic Content -->
    <main class="flex-1 w-full">
      ${content}
    </main>

  </div>

  <!-- Slide-out Sidebar Drawer -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
  <aside class="sidebar" id="sidebar">
    <div>
      <div class="flex items-center justify-between" style="padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 12px;">
        <div class="flex items-center gap-2">
          <div style="width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #0d9488); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">F</div>
          <span style="font-weight: 800; font-size: 16px; color: white; letter-spacing: -0.3px;">FinPulse</span>
        </div>
        <button onclick="toggleSidebar()" style="color: var(--text-muted); font-size: 16px; padding: 4px;">✕</button>
      </div>
      <nav class="space-y-1">
        ${sideNavHtml}
      </nav>
    </div>

    <div style="padding-top: 12px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
      <div class="flex items-center gap-2">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(59, 130, 246, 0.2); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">${userInitial}</div>
        <div style="font-size: 11px; line-height: 1.2;">
          <p style="font-weight: 600; color: #ffffff;">${userName}</p>
          <p style="color: var(--text-dim); max-width: 140px;" class="truncate">${esc(user?.email || '')}</p>
        </div>
      </div>
      <a href="/logout" style="padding: 8px; color: #fb7185;" title="Logout">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </a>
    </div>
  </aside>

  <!-- Frosted Glass Bottom Navigation Bar -->
  <nav class="bottom-nav">
    <a href="/" class="bottom-nav-link ${activePage === 'dashboard' ? 'active' : ''}">
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      <span>Home</span>
    </a>
    <a href="/expenses" class="bottom-nav-link ${activePage === 'expenses' || activePage === 'income' ? 'active' : ''}">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
      <span>Activity</span>
    </a>
    <div class="bottom-nav-center-wrap">
      <button onclick="openQuickAddSheet('expense')" class="bottom-nav-center-btn" aria-label="Quick Add Transaction">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    <a href="/chat" class="bottom-nav-link ${activePage === 'chat' ? 'active' : ''}">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
      <span>AI Advisor</span>
    </a>
    <a href="/budgets" class="bottom-nav-link ${activePage === 'budgets' ? 'active' : ''}">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      <span>Budgets</span>
    </a>
  </nav>

  <!-- Sliding Quick Add Bottom Sheet -->
  <div class="sheet-overlay" id="quickAddOverlay" onclick="closeQuickAddSheet()"></div>
  <div class="bottom-sheet" id="quickAddSheet">
    <div class="sheet-handle"></div>

    <div class="flex items-center justify-between" style="padding-bottom: 8px; border-bottom: 1px solid var(--border); margin-bottom: 8px;">
      <div class="flex items-center gap-2">
        <button id="qaExpenseBtn" onclick="setQaType('expense')" class="qa-cat-chip active" style="font-weight: 700;">Expense</button>
        <button id="qaIncomeBtn" onclick="setQaType('income')" class="qa-cat-chip" style="font-weight: 700;">Income</button>
      </div>
      <button onclick="closeQuickAddSheet()" style="width: 28px; height: 28px; border-radius: 50%; background: var(--surface-2); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer;">✕</button>
    </div>

    <!-- Tactile Big Amount Display -->
    <div class="qa-display-wrap">
      <span class="qa-display-label">Enter Amount</span>
      <div class="qa-amount-val">
        <span style="font-size: 20px; color: var(--text-muted);">SAR</span>
        <span id="qaDisplay">0.00</span>
      </div>
    </div>

    <!-- Quick Category Chips Carousel -->
    <div style="margin-bottom: 4px;">
      <span class="qa-display-label" style="display: block; margin-bottom: 6px;">Category</span>
      <div class="flex items-center gap-2 no-scrollbar" style="overflow-x: auto; padding-bottom: 6px;">
        <button type="button" onclick="selectQaCat('🍔 Food & Dining')" class="qa-cat-chip active flex-shrink-0">🍔 Food</button>
        <button type="button" onclick="selectQaCat('🚕 Transport')" class="qa-cat-chip flex-shrink-0">🚕 Transport</button>
        <button type="button" onclick="selectQaCat('🛍️ Shopping')" class="qa-cat-chip flex-shrink-0">🛍️ Shopping</button>
        <button type="button" onclick="selectQaCat('💡 Bills')" class="qa-cat-chip flex-shrink-0">💡 Bills</button>
        <button type="button" onclick="selectQaCat('🛒 Groceries')" class="qa-cat-chip flex-shrink-0">🛒 Groceries</button>
        <button type="button" onclick="selectQaCat('🍿 Fun')" class="qa-cat-chip flex-shrink-0">🍿 Fun</button>
      </div>
    </div>

    <!-- Tactile 3x4 Numpad Grid -->
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
      <button type="button" onclick="qaDel()" class="qa-key" style="color: var(--text-muted);" aria-label="Backspace">⌫</button>
    </div>

    <button type="button" id="qaSubmitBtn" onclick="qaCommit()" class="qa-submit-btn">
      Save Transaction
    </button>
  </div>

  <script>
    function haptic(ms = 10) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(ms); } catch(e) {}
      }
    }

    function togglePrivacy() {
      haptic(15);
      const isMasked = document.body.classList.toggle('privacy-masked');
      try { localStorage.setItem('finpulse_privacy', isMasked ? '1' : '0'); } catch(e) {}
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('finpulse_privacy') === '1') {
      document.body.classList.add('privacy-masked');
    }

    function toggleSidebar() {
      haptic(10);
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    let _qaType = 'expense';
    let _qaNumStr = '';
    let _qaCat = '🍔 Food & Dining';

    function openQuickAddSheet(type = 'expense') {
      haptic(15);
      setQaType(type);
      _qaNumStr = '';
      updateQaDisplay();
      document.getElementById('quickAddSheet').classList.add('open');
      document.getElementById('quickAddOverlay').classList.add('active');
    }

    function closeQuickAddSheet() {
      haptic(10);
      document.getElementById('quickAddSheet').classList.remove('open');
      document.getElementById('quickAddOverlay').classList.remove('active');
    }

    function setQaType(type) {
      haptic(10);
      _qaType = type;
      const expBtn = document.getElementById('qaExpenseBtn');
      const incBtn = document.getElementById('qaIncomeBtn');
      if (type === 'expense') {
        expBtn.classList.add('active');
        incBtn.classList.remove('active');
      } else {
        incBtn.classList.add('active');
        expBtn.classList.remove('active');
      }
    }

    function selectQaCat(cat) {
      haptic(10);
      _qaCat = cat;
      document.querySelectorAll('.bottom-sheet .qa-cat-chip').forEach(btn => {
        if (btn.innerText.includes(cat.split(' ')[1] || cat)) {
          btn.classList.add('active');
        } else if (!btn.id.includes('qaExpense') && !btn.id.includes('qaIncome')) {
          btn.classList.remove('active');
        }
      });
    }

    function qaNum(char) {
      haptic(8);
      if (char === '.' && _qaNumStr.includes('.')) return;
      if (_qaNumStr.length >= 8) return;
      _qaNumStr += char;
      updateQaDisplay();
    }

    function qaDel() {
      haptic(12);
      _qaNumStr = _qaNumStr.slice(0, -1);
      updateQaDisplay();
    }

    function updateQaDisplay() {
      const el = document.getElementById('qaDisplay');
      if (!_qaNumStr) {
        el.innerText = '0.00';
      } else {
        el.innerText = _qaNumStr;
      }
    }

    async function qaCommit() {
      const amount = parseFloat(_qaNumStr);
      if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
      }
      haptic(25);
      const btn = document.getElementById('qaSubmitBtn');
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const endpoint = _qaType === 'income' ? '/income' : '/expenses';
      const cleanCat = _qaCat.replace(/^[^\w\s]+/, '').trim() || 'General';
      const body = new URLSearchParams({
        amount: amount.toString(),
        category: cleanCat,
        date: new Date().toISOString().split('T')[0],
        description: cleanCat
      });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
        if (res.ok || res.redirected) {
          window.location.href = '/';
        } else {
          alert('Could not save transaction. Please try again.');
          btn.disabled = false;
          btn.innerText = 'Save Transaction';
        }
      } catch (err) {
        alert('Network error. Please try again.');
        btn.disabled = false;
        btn.innerText = 'Save Transaction';
      }
    }
  </script>

  ${scripts}
</body>
</html>`;
}
