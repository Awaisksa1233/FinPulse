import { baseLayout, esc } from './base.js';

export function adminPage({ user, users = [], stats = {}, flash = [] }) {
  const userRows = (users || []).map(u => `
    <tr>
      <td style="padding:14px 18px;font-weight:600;color:var(--text);">${esc(u.full_name || '—')}</td>
      <td style="padding:14px 18px;color:var(--text-muted);font-family:monospace;font-size:12.5px;">${esc(u.email)}</td>
      <td style="padding:14px 18px;">
        <span class="badge ${u.is_admin ? 'badge-warning' : 'badge-primary'}">
          ${u.is_admin ? 'Admin' : 'Member'}
        </span>
      </td>
      <td style="padding:14px 18px;color:var(--text-light);font-size:12.5px;">
        ${esc(u.created_at ? u.created_at.split('T')[0] : '—')}
      </td>
      <td style="padding:14px 18px;">
        ${u.id !== user.id ? `
        <form method="POST" action="/admin/user/${u.id}/delete" onsubmit="return confirm('Delete user ${esc(u.email)}? All transactions and accounts will be deleted.')" style="margin:0;">
          <button type="submit" class="btn btn-outline btn-sm" style="color:var(--red-600);border-color:rgba(220,38,38,.2);padding:4px 10px;font-size:12px;">Delete</button>
        </form>` : '<span class="badge badge-accent">You</span>'}
      </td>
    </tr>`).join('');

  const content = `
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Admin Management</h2>
        <p class="page-subtitle">Platform health, registered users, and system scheduled tasks.</p>
      </div>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <!-- Stats Row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
        ${[
          ['Total Users', stats?.total_users || 0, 'var(--blue-600)'],
          ['Total Transactions', stats?.total_transactions || 0, 'var(--green-600)'],
          ['Active Accounts', stats?.total_accounts || 0, 'var(--teal-600)'],
          ['Configured Budgets', stats?.total_budgets || 0, 'var(--amber-500)'],
        ].map(([label, val, color]) => `
        <div class="card" style="border-top:3px solid ${color};text-align:center;padding:20px 16px;">
          <p style="font-size:32px;font-weight:900;color:${color};margin:0;letter-spacing:-1px;">${val}</p>
          <p style="font-size:12px;font-weight:600;color:var(--text-muted);margin:6px 0 0;text-transform:uppercase;letter-spacing:.6px;">${label}</p>
        </div>`).join('')}
      </div>

      <!-- Users Table Card -->
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:24px;">
        <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-title" style="margin:0;">Registered Users</h3>
          <span class="badge badge-primary">${(users || []).length} Total</span>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;">
            <thead>
              <tr style="background:var(--slate-50);">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${userRows || '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-light);">No users found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- System Crons & Maintenance -->
      <div class="card card-accent-blue">
        <div class="card-header">
          <h3 class="card-title">System Operations & Cron Simulator</h3>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          Manually trigger edge crons on Cloudflare Workers without waiting for scheduled trigger cycles.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <form method="POST" action="/admin/process-recurring" style="margin:0;">
            <button type="submit" class="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>
              Process Recurring Templates Now
            </button>
          </form>
          <form method="POST" action="/admin/send-daily-reports" style="margin:0;">
            <button type="submit" class="btn btn-outline btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Dispatch Telegram Daily Reports
            </button>
          </form>
        </div>
      </div>
    </div>`;

  return baseLayout({
    title: 'Admin',
    activePage: 'admin',
    content,
    user,
    flash
  });
}
