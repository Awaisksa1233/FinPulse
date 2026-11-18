// Base HTML layout — Modern Mobile-First Fintech Design System

export function baseLayout({ title, activePage, content, scripts = '', user, flash = [] }) {
  const flashHtml = flash.length ? `
    <div class="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none" id="toastContainer">
      ${flash.map(f => {
        const isErr = f.category === 'error' || f.type === 'error';
        return `
        <div class="toast pointer-events-auto flex items-center justify-between p-3 rounded-2xl text-xs font-semibold shadow-lg backdrop-blur-md ${isErr ? 'bg-rose-950/90 text-rose-200 border border-rose-800/60' : 'bg-emerald-950/90 text-emerald-200 border border-emerald-800/60'} animate-bounce">
          <div class="flex items-center gap-2">
            <span>${isErr ? '✕' : '✓'}</span>
            <span>${esc(f.message)}</span>
          </div>
          <button class="toast-close opacity-60 hover:opacity-100" onclick="this.closest('.toast').remove()" aria-label="Close">×</button>
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
    <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 pt-3 pb-1 block">${sec.label}</span>
    ${sec.items.map(n => `
      <a href="${n.href}" class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${activePage === n.page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'} transition-all">
        ${n.icon}
        <span>${n.label}</span>
      </a>
    `).join('')}
  `).join('');

  const userInitial = esc((user?.full_name || user?.name || user?.email || 'U').charAt(0).toUpperCase());
  const userName = esc(user?.full_name || user?.name || user?.email?.split('@')[0] || 'User');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${esc(title)} - FinPulse</title>
  <meta name="description" content="FinPulse - Intelligent Personal Finance Dashboard">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="manifest" href="/static/manifest.json">
  <meta name="theme-color" content="#090d16">
  <link rel="apple-touch-icon" href="/static/icons/icon-180.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #090d16;
      --surface: #121826;
      --surface-elevated: #1a2236;
      --border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
    }
    body {
      background-color: #090d16 !important;
      color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .sheet-transition { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
    .fab-glow { box-shadow: 0 8px 24px -2px rgba(59, 130, 246, 0.5), 0 0 12px 2px rgba(13, 148, 136, 0.3); }
    body.privacy-masked .privacy-val { filter: blur(8px); user-select: none; pointer-events: none; transition: filter 0.2s ease; }
    .sidebar-overlay.active { opacity: 1; pointer-events: auto; }
    .sidebar.open { transform: translateX(0); }
  </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen antialiased select-none">

  ${flashHtml}

  <!-- App Viewport Container (Centered mobile chassis max-w-[430px]) -->
  <div class="w-full max-w-[430px] mx-auto min-h-screen flex flex-col relative px-3 pt-2 pb-24">

    <!-- Mobile Header -->
    <header class="mobile-header flex items-center justify-between py-2 border-b border-slate-800/80 mb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-[2px] shadow-sm flex-shrink-0">
          <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-sm text-blue-400">
            ${userInitial}
          </div>
        </div>
        <div>
          <p class="text-[10px] text-slate-400 leading-none">Welcome back,</p>
          <h2 class="text-sm font-bold text-slate-100 leading-tight">${userName}</h2>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="togglePrivacy()" title="Toggle Privacy" class="mobile-header-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <a href="/chat" class="mobile-header-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all" title="AI Advisor">
          ${chatIcon}
        </a>
        <button id="hamburgerBtn" onclick="toggleSidebar()" class="mobile-header-btn hamburger-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all" aria-label="Toggle navigation">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 w-full">
      ${content}
    </main>

  </div>

  <!-- Slide-out Sidebar Drawer -->
  <div class="sidebar-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300" id="sidebarOverlay" onclick="toggleSidebar()"></div>
  <aside class="sidebar fixed top-0 left-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800/80 z-50 p-4 transform -translate-x-full transition-transform duration-300 flex flex-col justify-between shadow-2xl" id="sidebar">
    <div>
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center font-bold text-white text-sm shadow">F</div>
          <span class="font-bold text-base text-white tracking-tight">FinPulse</span>
        </div>
        <button onclick="toggleSidebar()" class="text-slate-400 hover:text-white p-1 text-sm">✕</button>
      </div>
      <nav class="space-y-1">
        ${sideNav}
      </nav>
    </div>
    <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">${userInitial}</div>
        <div class="text-[11px] leading-tight">
          <p class="font-semibold text-slate-200">${userName}</p>
          <p class="text-slate-500 truncate max-w-[120px]">${esc(user?.email || '')}</p>
        </div>
      </div>
      <a href="/logout" class="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-900" title="Logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </a>
    </div>
  </aside>

  <!-- Frosted Glass Bottom Navigation Bar -->
  <nav class="bottom-nav fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around px-3 z-40 max-w-[430px] mx-auto">
    <a href="/" class="bottom-nav-link flex flex-col items-center gap-1 ${activePage === 'dashboard' ? 'text-blue-400' : 'text-slate-400'} active:scale-90 transition-all">
      ${dashIcon}
      <span class="text-[10px] font-semibold">Home</span>
    </a>
    <a href="/expenses" class="bottom-nav-link flex flex-col items-center gap-1 ${activePage === 'expenses' || activePage === 'income' ? 'text-blue-400' : 'text-slate-400'} active:scale-90 transition-all">
      ${expenseIcon}
      <span class="text-[10px] font-semibold">Activity</span>
    </a>
    <div class="bottom-nav-center-wrap relative -top-4">
      <button onclick="openQuickAddSheet('expense')" class="bottom-nav-center-btn w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 text-white flex items-center justify-center fab-glow active:scale-95 transition-all shadow-lg" aria-label="Quick Add Transaction">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    <a href="/chat" class="bottom-nav-link flex flex-col items-center gap-1 ${activePage === 'chat' ? 'text-blue-400' : 'text-slate-400'} active:scale-90 transition-all">
      ${chatIcon}
      <span class="text-[10px] font-semibold">AI Advisor</span>
    </a>
    <a href="/budgets" class="bottom-nav-link flex flex-col items-center gap-1 ${activePage === 'budgets' ? 'text-blue-400' : 'text-slate-400'} active:scale-90 transition-all">
      ${budgetIcon}
      <span class="text-[10px] font-semibold">Budgets</span>
    </a>
  </nav>

  <!-- Quick Add Sliding Bottom Sheet -->
  <div id="quickAddOverlay" onclick="closeQuickAddSheet()" class="sheet-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>

  <div id="quickAddSheet" class="bottom-sheet fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-slate-900 border-t border-slate-700/80 rounded-t-[32px] p-4 z-50 transform translate-y-full sheet-transition shadow-2xl flex flex-col max-h-[85vh]">
    <div class="sheet-handle w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3"></div>

    <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
      <div class="sheet-type-pills flex items-center gap-2">
        <button id="qaExpenseBtn" onclick="setQaType('expense')" class="sheet-type-btn px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">Expense</button>
        <button id="qaIncomeBtn" onclick="setQaType('income')" class="sheet-type-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">Income</button>
      </div>
      <button onclick="closeQuickAddSheet()" class="sheet-close-btn w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white" aria-label="Close">✕</button>
    </div>

    <!-- Tactile Big Number Display -->
    <div class="text-center py-2">
      <span class="text-xs text-slate-400 block mb-0.5">Enter Amount</span>
      <div class="text-4xl font-extrabold font-mono text-white tracking-tight flex items-center justify-center">
        <span class="text-slate-500 text-2xl mr-1">SAR</span>
        <span id="qaDisplay">0.00</span>
      </div>
    </div>

    <!-- Quick Category Chips -->
    <div class="py-2">
      <span class="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block mb-1.5">Category</span>
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button type="button" onclick="selectQaCat('🍔 Food & Dining')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-blue-600 text-white font-medium flex-shrink-0">🍔 Food</button>
        <button type="button" onclick="selectQaCat('🚕 Transport')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🚕 Transport</button>
        <button type="button" onclick="selectQaCat('🛍️ Shopping')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🛍️ Shopping</button>
        <button type="button" onclick="selectQaCat('💡 Bills')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">💡 Bills</button>
        <button type="button" onclick="selectQaCat('🛒 Groceries')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🛒 Groceries</button>
        <button type="button" onclick="selectQaCat('🍿 Fun')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🍿 Fun</button>
      </div>
    </div>

    <!-- Tactile Numpad Grid -->
    <div class="qa-numpad grid grid-cols-3 gap-2 pt-1 font-mono text-base font-semibold">
      <button type="button" onclick="qaNum('1')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">1</button>
      <button type="button" onclick="qaNum('2')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">2</button>
      <button type="button" onclick="qaNum('3')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">3</button>
      <button type="button" onclick="qaNum('4')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">4</button>
      <button type="button" onclick="qaNum('5')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">5</button>
      <button type="button" onclick="qaNum('6')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">6</button>
      <button type="button" onclick="qaNum('7')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">7</button>
      <button type="button" onclick="qaNum('8')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">8</button>
      <button type="button" onclick="qaNum('9')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">9</button>
      <button type="button" onclick="qaNum('.')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">.</button>
      <button type="button" onclick="qaNum('0')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition-all">0</button>
      <button type="button" onclick="qaDel()" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all flex items-center justify-center" aria-label="Backspace">⌫</button>
    </div>

    <button type="button" id="qaSubmitBtn" onclick="qaCommit()" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wide shadow-lg active:scale-[0.98] transition-all">
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
        overlay.classList.remove('pointer-events-none');
        overlay.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
      }
    }

    function closeQuickAddSheet() {
      const overlay = document.getElementById('quickAddOverlay');
      const sheet = document.getElementById('quickAddSheet');
      if (overlay && sheet) {
        overlay.classList.add('pointer-events-none');
        overlay.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
      }
    }

    function setQaType(type) {
      haptic(8);
      _qaType = type;
      const expBtn = document.getElementById('qaExpenseBtn');
      const incBtn = document.getElementById('qaIncomeBtn');
      if (expBtn && incBtn) {
        if (type === 'expense') {
          expBtn.className = 'sheet-type-btn px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white';
          incBtn.className = 'sheet-type-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400';
        } else {
          incBtn.className = 'sheet-type-btn px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white';
          expBtn.className = 'sheet-type-btn px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400';
        }
      }
    }

    function selectQaCat(cat) {
      haptic(6);
      _qaCategory = cat.replace(/^[^\s]+\s+/, '');
      document.querySelectorAll('.qa-cat-chip').forEach(c => {
        if (c.textContent.includes(cat.slice(2))) {
          c.className = 'qa-cat-chip px-3 py-1.5 rounded-xl bg-blue-600 text-white font-medium flex-shrink-0';
        } else {
          c.className = 'qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0';
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

    function toggleSidebar() {
      const s = document.getElementById('sidebar');
      const o = document.getElementById('sidebarOverlay');
      if (s && o) {
        s.classList.toggle('open');
        o.classList.toggle('active');
      }
    }
  </script>
  ${scripts}
</body>
</html>`;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const iconProps = `class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
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
export const settingsIcon = `<svg ${iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
export const shortcutIcon = `<svg ${iconProps}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

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
