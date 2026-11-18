// src/templates/loans.js
import { baseLayout } from './base.js';

export function loansPage({ user, loanAccounts = [], flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">Loans & Debts</h2>
      <div class="space-y-2">
        ${loanAccounts.length > 0 ? loanAccounts.map(l => `
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span class="text-xs font-bold text-white">${l.person_name}</span>
            <span class="text-xs font-mono text-emerald-400 privacy-val">SAR ${l.total || 0}</span>
          </div>
        `).join('') : '<p class="text-xs text-slate-500 text-center py-4">No active loans.</p>'}
      </div>
    </div>
  `;
  return baseLayout({ title: 'Loans', activePage: 'dashboard', content, user, flash });
}
