import { baseLayout, esc, fmt } from './base.js';

export function adminPage({ user, users, stats, flash }) {
  const userRows = (users || []).map(u => `
    <tr>
      <td style="padding:12px 16px;">${esc(u.full_name || '—')}</td>
      <td style="padding:12px 16px;color:var(--gray-600);">${esc(u.email)}</td>
      <td style="padding:12px 16px;">
        <span style="font-size:12px;padding:3px 10px;border-radius:999px;background:${u.is_admin ? '#fef3c7' : '#f0fdf4'};color:${u.is_admin ? '#92400e' : '#166534'};">
          ${u.is_admin ? 'Admin' : 'User'}
        </span>
      </td>
      <td style="padding:12px 16px;color:var(--gray-500);font-size:13px;">${esc(u.created_at ? u.created_at.split('T')[0] : '—')}</td>
      <td style="padding:12px 16px;">
        ${u.id !== user.id ? `
        <form method="POST" action="/admin/user/${u.id}/delete" onsubmit="return confirm('Delete user ${esc(u.email)}? All their data will be removed.')">
          <button type="submit" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px;hover:background:#fef2f2;">Delete</button>
        </form>` : '<span style="font-size:13px;color:var(--gray-400);">You</span>'}
      </td>
    </tr>`).join('');

  const content = `
    <header class="page-header" style="margin-bottom:24px;">
      <h2 class="page-title">Admin</h2>
      <p class="page-subtitle">Manage users and system settings.</p>
    </header>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;margin-bottom:24px;">
      ${[
        ['Total Users', stats?.total_users || 0, '#6366f1'],
        ['Transactions', stats?.total_transactions || 0, '#16a34a'],
        ['Accounts', stats?.total_accounts || 0, '#0ea5e9'],
        ['Budgets', stats?.total_budgets || 0, '#f59e0b'],
      ].map(([label, val, color]) => `
      <div class="card" style="text-align:center;border-top:3px solid ${color};">
        <p style="font-size:24px;font-weight:800;color:${color};margin:0;">${val}</p>
        <p style="font-size:12px;color:var(--gray-500);margin:4px 0 0;">${label}</p>
      </div>`).join('')}
    </div>

    <!-- Users Table -->
    <div class="card" style="overflow:hidden;padding:0;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--gray-100);display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;font-size:16px;">Users</h3>
        <span style="font-size:13px;color:var(--gray-500);">${(users || []).length} total</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:var(--gray-50);">
              <th style="text-align:left;padding:10px 16px;font-size:12px;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Name</th>
              <th style="text-align:left;padding:10px 16px;font-size:12px;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Email</th>
              <th style="text-align:left;padding:10px 16px;font-size:12px;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Role</th>
              <th style="text-align:left;padding:10px 16px;font-size:12px;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Joined</th>
              <th style="text-align:left;padding:10px 16px;font-size:12px;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${userRows || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400);">No users found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- System Actions -->
    <div class="card" style="margin-top:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;">System</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <form method="POST" action="/admin/process-recurring">
          <button type="submit" class="btn btn-ghost" style="font-size:13px;">Process Recurring Templates</button>
        </form>
        <form method="POST" action="/admin/send-daily-reports">
          <button type="submit" class="btn btn-ghost" style="font-size:13px;">Send Daily Reports Now</button>
        </form>
      </div>
    </div>`;

  return baseLayout({ title: 'Admin', activePage: 'admin', content, user, flash });
}
