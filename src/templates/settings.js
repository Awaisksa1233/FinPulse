import { baseLayout, esc } from './base.js';

export function settingsPage({ user, flash = [] }) {
  const salaryDay = user?.salary_day || 28;

  const content = `
    <header class="page-header" style="margin-bottom:24px;">
      <div>
        <h2 class="page-title">Settings & Preferences</h2>
        <p class="page-subtitle">Configure your monthly salary cycle, profile, and budget preferences.</p>
      </div>
    </header>

    <div class="content-wrapper" style="padding-top:0;max-width:800px;">
      <!-- Salary & Budget Cycle Card -->
      <div class="card card-accent-blue" style="margin-bottom:24px;">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:rgba(37,99,235,0.1);color:var(--primary);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <h3 class="card-title">KSA Salary & Budget Cycle</h3>
              <p style="font-size:12.5px;color:var(--text-muted);margin:2px 0 0;">Align your financial month with your actual salary payment day</p>
            </div>
          </div>
        </div>

        <form method="POST" action="/settings/salary-cycle">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="font-size:24px;line-height:1;">💡</div>
              <div style="font-size:13px;color:#334155;line-height:1.5;">
                In Saudi Arabia, salaries are often received at the end of the month (e.g. 28th) for the upcoming month. 
                Setting your salary day ensures that salary and any expenses incurred from the <strong>${salaryDay}th</strong> onward are automatically allocated to next month's budget.
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Salary Payment Day of Month (1 - 31)</label>
              <div style="display:flex;align-items:center;gap:12px;">
                <input type="number" name="salary_day" min="1" max="31" value="${salaryDay}" required class="form-control" style="width:120px;font-weight:700;font-size:16px;">
                <span style="font-size:13px;color:var(--text-muted);">th of each month</span>
              </div>
              <span style="font-size:11.5px;color:var(--text-muted);display:block;margin-top:6px;">
                Transactions from day <strong>${salaryDay}</strong> through day <strong>${salaryDay - 1}</strong> of the next month belong to that cycle.
              </span>
            </div>
          </div>

          <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;">
            <button type="submit" class="btn btn-primary">
              Save Cycle Day
            </button>
          </div>
        </form>

        <hr style="border:none;border-top:1px solid var(--border);margin:24px 0 20px;">

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h4 style="font-size:14px;font-weight:700;color:var(--text-dark);margin:0 0 4px;">Reassign Existing Transactions</h4>
            <p style="font-size:12px;color:var(--text-muted);margin:0;">Recalculate budget months for all existing transactions using day ${salaryDay}.</p>
          </div>
          <form method="POST" action="/settings/reassign-budget-months" onsubmit="return confirm('Recalculate budget months for all existing transactions according to day ${salaryDay}?')">
            <button type="submit" class="btn btn-secondary btn-sm">
              Recalculate Past Transactions
            </button>
          </form>
        </div>
      </div>

      <!-- Profile Details Card -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">Profile Information</h3>
        </div>
        <form method="POST" action="/settings/profile">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" value="${esc(user?.email || '')}" disabled class="form-control" style="background:#f1f5f9;cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" name="full_name" value="${esc(user?.full_name || '')}" class="form-control" placeholder="Your name">
          </div>
          <button type="submit" class="btn btn-secondary">
            Update Profile
          </button>
        </form>
      </div>

      <!-- Quick Links Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Connected Integrations</h3>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <a href="/telegram" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:inherit;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:20px;">✈️</span>
              <div>
                <strong style="font-size:13.5px;display:block;">Telegram Bot & Daily Reports</strong>
                <span style="font-size:12px;color:var(--text-muted);">Connect your chat for quick voice/text logging</span>
              </div>
            </div>
            <span style="color:var(--primary);font-size:13px;font-weight:600;">Manage →</span>
          </a>
          <a href="/shortcut" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:inherit;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:20px;">⚡</span>
              <div>
                <strong style="font-size:13.5px;display:block;">Apple Shortcuts & Siri</strong>
                <span style="font-size:12px;color:var(--text-muted);">Set up 1-tap logging widgets on iPhone</span>
              </div>
            </div>
            <span style="color:var(--primary);font-size:13px;font-weight:600;">Setup →</span>
          </a>
        </div>
      </div>
    </div>
  `;

  return baseLayout({
    title: 'Settings',
    activePage: 'settings',
    content,
    user,
    flash,
  });
}
