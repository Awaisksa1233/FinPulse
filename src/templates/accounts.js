// src/templates/accounts.js
import { baseLayout } from './base.js';

export function accountsPage({ user, accounts = [], flash = [] }) {
  const content = `
    <div class="space-y-4">
      <div class="flex items-center justify-between pt-1">
        <h2 class="text-base font-bold text-white">Your Wallets & Accounts</h2>
        <span class="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">${accounts.length} Total</span>
      </div>

      <div class="space-y-2.5">
        ${accounts.map(acc => `
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${acc.color || '#3b82f6'}"></span>
                <h4 class="text-xs font-bold text-slate-100">${acc.name}</h4>
                <span class="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${acc.type}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold font-mono text-white privacy-val">SAR ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Add Account Form -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-xs font-bold text-slate-200">Add New Account</h3>
        <form method="POST" action="/account" class="space-y-2.5">
          <input type="text" name="name" required placeholder="Account Name (e.g. Al Rajhi)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          <div class="grid grid-cols-2 gap-2">
            <select name="type" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
              <option value="bank">Bank Checking</option>
              <option value="savings">Savings Vault</option>
              <option value="cash">Cash Wallet</option>
              <option value="credit">Credit Card</option>
            </select>
            <input type="number" step="0.01" name="balance" placeholder="Initial Balance (SAR)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">Create Account</button>
        </form>
      </div>
    </div>
  `;

  return baseLayout({
    title: 'Accounts',
    activePage: 'dashboard',
    content,
    user,
    flash
  });
}
