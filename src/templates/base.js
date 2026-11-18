// src/templates/base.js

export function baseLayout({ title = 'FinPulse', activePage = 'dashboard', content = '', user = null, flash = [] }) {
  const userName = user?.full_name || 'Awais Khan';
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AK';

  const flashHtml = flash.map(f => `
    <div class="fixed top-14 left-4 right-4 z-50 p-3 rounded-2xl text-xs font-semibold shadow-lg backdrop-blur-md ${f.type === 'error' ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-slate-950'}">
      ${f.message}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${title} – FinPulse</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    :root {
      --bg: #090d16;
      --surface: #121826;
      --surface-elevated: #1a2236;
      --border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
    }
    * { -webkit-tap-highlight-color: transparent; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .privacy-masked .privacy-val { filter: blur(7px); user-select: none; }
    .privacy-val { transition: filter 0.2s ease; }
    .sheet-transition { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
    .fab-glow { box-shadow: 0 8px 24px -2px rgba(59, 130, 246, 0.5), 0 0 12px 2px rgba(13, 148, 136, 0.3); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-start p-0 sm:p-6 antialiased select-none font-sans">
  ${flashHtml}

  <!-- Mobile Frame Chassis -->
  <div class="w-full max-w-[400px] min-h-screen sm:min-h-[820px] sm:max-h-[860px] bg-[#090d16] sm:border-[7px] sm:border-slate-800 sm:rounded-[44px] shadow-2xl relative overflow-hidden flex flex-col">
    
    <!-- Top System & Dynamic Header -->
    <header class="mobile-header px-5 pt-3 pb-2 flex items-center justify-between z-30">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-[2px] shadow-sm">
          <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-blue-400">
            ${userInitials}
          </div>
        </div>
        <div>
          <span class="text-[11px] text-slate-400 leading-none block">Welcome back,</span>
          <h2 class="text-sm font-bold text-slate-100">${userName}</h2>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="togglePrivacy()" title="Toggle Privacy" class="mobile-header-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <a href="/settings" class="mobile-header-btn p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </a>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-24">
      ${content}
    </main>

    <!-- Frosted Bottom Navigation Bar -->
    <nav class="bottom-nav absolute bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around px-3 z-30">
      <a href="/" class="flex flex-col items-center gap-1 ${activePage === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'} transition">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <span class="text-[10px] font-semibold">Home</span>
      </a>

      <a href="/expenses" class="flex flex-col items-center gap-1 ${activePage === 'transactions' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'} transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
        <span class="text-[10px] font-semibold">Activity</span>
      </a>

      <!-- Center Action (+) Button -->
      <div class="relative -top-4">
        <button onclick="openQuickAddSheet('expense')" class="bottom-nav-center-btn w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 text-white flex items-center justify-center fab-glow active:scale-95 transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <a href="/chat" class="flex flex-col items-center gap-1 ${activePage === 'chat' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'} transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
        <span class="text-[10px] font-semibold">AI Advisor</span>
      </a>

      <a href="/budgets" class="flex flex-col items-center gap-1 ${activePage === 'budgets' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'} transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        <span class="text-[10px] font-semibold">Budgets</span>
      </a>
    </nav>

    <!-- Bottom Sheet: Quick Add Numpad -->
    <div id="qaBackdrop" onclick="closeQuickAddSheet()" class="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <div id="quickAddSheet" class="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/80 rounded-t-[32px] p-4 z-50 transform translate-y-full sheet-transition shadow-2xl flex flex-col">
      <div class="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3"></div>

      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <button id="qaTypeExpense" onclick="setQaType('expense')" class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">Expense</button>
          <button id="qaTypeIncome" onclick="setQaType('income')" class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">Income</button>
        </div>
        <button onclick="closeQuickAddSheet()" class="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white">✕</button>
      </div>

      <form id="qaForm" method="POST" action="/transaction" onsubmit="return handleQaSubmit(event)">
        <input type="hidden" name="type" id="qaInputType" value="expense">
        <input type="hidden" name="amount" id="qaInputAmount" value="0">
        <input type="hidden" name="category" id="qaInputCategory" value="Food">

        <div class="text-center py-2">
          <span class="text-xs text-slate-400 block mb-0.5">Amount (SAR)</span>
          <div class="text-3xl font-extrabold font-mono text-white tracking-tight flex items-center justify-center">
            <span class="text-slate-500 text-xl mr-1">SAR</span>
            <span id="qaDisplay">0.00</span>
          </div>
        </div>

        <div class="py-2">
          <span class="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block mb-1.5">Category</span>
          <div id="qaCategoryContainer" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button type="button" onclick="setQaCat('Food & Dining')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-blue-600 text-white font-medium flex-shrink-0">🍔 Food</button>
            <button type="button" onclick="setQaCat('Transport')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🚕 Transport</button>
            <button type="button" onclick="setQaCat('Shopping')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">🛍️ Shopping</button>
            <button type="button" onclick="setQaCat('Bills & Utilities')" class="qa-cat-chip px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium flex-shrink-0">💡 Bills</button>
          </div>
        </div>


        <div class="qa-numpad grid grid-cols-3 gap-2 pt-1 font-mono text-base font-semibold">
          <button type="button" onclick="qaNum('1')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">1</button>
          <button type="button" onclick="qaNum('2')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">2</button>
          <button type="button" onclick="qaNum('3')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">3</button>
          <button type="button" onclick="qaNum('4')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">4</button>
          <button type="button" onclick="qaNum('5')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">5</button>
          <button type="button" onclick="qaNum('6')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">6</button>
          <button type="button" onclick="qaNum('7')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">7</button>
          <button type="button" onclick="qaNum('8')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">8</button>
          <button type="button" onclick="qaNum('9')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">9</button>
          <button type="button" onclick="qaNum('.')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">.</button>
          <button type="button" onclick="qaNum('0')" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white transition">0</button>
          <button type="button" onclick="qaDelete()" class="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-rose-400 transition">⌫</button>
        </div>

        <button type="submit" onclick="qaCommit()" class="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wide shadow-lg active:scale-98 transition">
          Save Transaction
        </button>
      </form>
    </div>

  </div>

  <script>
    let isPrivacy = false;
    function togglePrivacy() {
      isPrivacy = !isPrivacy;
      document.body.classList.toggle('privacy-masked', isPrivacy);
    }

    let qaAmount = '';
    let qaTypeVal = 'expense';
    let qaCategoryVal = 'Food & Dining';

    function openQuickAddSheet(type = 'expense') {
      qaAmount = '';
      setQaType(type);
      updateQa();
      const b = document.getElementById('qaBackdrop');
      const s = document.getElementById('quickAddSheet');
      b.classList.remove('pointer-events-none', 'opacity-0');
      b.classList.add('opacity-100');
      s.classList.remove('translate-y-full');
    }

    function closeQuickAddSheet() {
      const b = document.getElementById('qaBackdrop');
      const s = document.getElementById('quickAddSheet');
      b.classList.add('pointer-events-none', 'opacity-0');
      b.classList.remove('opacity-100');
      s.classList.add('translate-y-full');
    }

    const qaExpenseCats = [
      { name: 'Food & Dining', emoji: '🍔' },
      { name: 'Groceries', emoji: '🛒' },
      { name: 'Transport', emoji: '🚕' },
      { name: 'Shopping', emoji: '🛍️' },
      { name: 'Bills & Utilities', emoji: '💡' },
      { name: 'Healthcare', emoji: '🏥' },
      { name: 'Entertainment', emoji: '🍿' }
    ];

    const qaIncomeCats = [
      { name: 'Salary', emoji: '💼' },
      { name: 'Consulting', emoji: '💻' },
      { name: 'Bonus', emoji: '📈' },
      { name: 'Business', emoji: '🏢' },
      { name: 'Investments', emoji: '🪙' },
      { name: 'Gift', emoji: '🎁' },
      { name: 'Other Income', emoji: '💰' }
    ];

    function setQaType(t) {
      qaTypeVal = t;
      document.getElementById('qaInputType').value = t;
      const eb = document.getElementById('qaTypeExpense');
      const ib = document.getElementById('qaTypeIncome');
      if (t === 'expense') {
        eb.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white';
        ib.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400';
      } else {
        ib.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white';
        eb.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400';
      }
      renderQaCategoryChips();
    }

    function renderQaCategoryChips() {
      const container = document.getElementById('qaCategoryContainer');
      if (!container) return;
      const cats = qaTypeVal === 'expense' ? qaExpenseCats : qaIncomeCats;

      if (!qaCategoryVal || !cats.some(c => c.name === qaCategoryVal)) {
        qaCategoryVal = cats[0].name;
        document.getElementById('qaInputCategory').value = qaCategoryVal;
      }

      container.innerHTML = cats.map(c => {
        const isSelected = qaCategoryVal === c.name;
        const activeCls = qaTypeVal === 'expense' ? 'bg-blue-600 text-white font-bold' : 'bg-emerald-600 text-white font-bold';
        return '<button type="button" onclick="setQaCat(\'' + c.name + '\')" class="qa-cat-chip px-3 py-1.5 rounded-xl ' + (isSelected ? activeCls : 'bg-slate-800 text-slate-300 font-medium') + ' flex-shrink-0 transition">' + c.emoji + ' ' + c.name + '</button>';
      }).join('');
    }


    function setQaCat(cat) {
      qaCategoryVal = cat;
      document.getElementById('qaInputCategory').value = cat;
      renderQaCategoryChips();
    }


    function qaNum(c) {
      if (c === '.' && qaAmount.includes('.')) return;
      if (qaAmount.length >= 7) return;
      qaAmount += c;
      updateQa();
    }

    function qaDelete() {
      qaAmount = qaAmount.slice(0, -1);
      updateQa();
    }

    function updateQa() {
      document.getElementById('qaDisplay').innerText = qaAmount || '0.00';
      document.getElementById('qaInputAmount').value = qaAmount || '0';
    }

    function qaCommit() {
      document.getElementById('qaInputAmount').value = qaAmount || '0';
    }

    async function handleQaSubmit(e) {
      const val = parseFloat(qaAmount);
      if (isNaN(val) || val <= 0) {
        e.preventDefault();
        alert('Please enter an amount > 0');
        return false;
      }
      return true;
    }
  </script>
</body>
</html>`;
}
