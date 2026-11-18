// src/templates/admin.js
import { baseLayout } from './base.js';

export function adminPage({ users = [], stats = {}, flash = [] }) {
  const content = `
    <div class="space-y-4">
      <h2 class="text-base font-bold text-white">System Admin</h2>
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
        <p>Total Registered Users: ${users.length}</p>
      </div>
    </div>
  `;
  return baseLayout({ title: 'Admin', activePage: 'settings', content, flash });
}
