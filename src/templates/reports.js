import { baseLayout, esc, fmt, currentMonth } from './base.js';

export function reportsPage({ user, month, income, expenses, categorySpend, dailySpend, flash }) {
  const net = income - expenses;
  const categories = Object.entries(categorySpend || {}).sort((a, b) => b[1] - a[1]);
  const topCat = categories[0];
  const maxSpend = categories[0]?.[1] || 1;

  const catBars = categories.map(([cat, amount]) => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
        <span style="font-weight:500;">${esc(cat)}</span>
        <span style="color:var(--gray-600);">SAR ${fmt(amount)}</span>
      </div>
      <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;">
        <div style="height:100%;width:${Math.round((amount / maxSpend) * 100)}%;background:var(--primary);border-radius:999px;"></div>
      </div>
    </div>`).join('') || '<p style="color:var(--gray-400);font-size:14px;">No spending data for this period.</p>';

  // Mini calendar heatmap-style daily bars
  const days = Object.entries(dailySpend || {}).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...days.map(([, v]) => v), 1);
  const dailyBars = days.map(([date, amount]) => {
    const opacity = 0.15 + (amount / maxDay) * 0.85;
    const day = date.split('-')[2];
    return `<div title="${date}: SAR ${fmt(amount)}" style="display:flex;flex-direction:column;align-items:center;gap:3px;">
      <div style="width:28px;height:28px;border-radius:4px;background:rgba(99,102,241,${opacity.toFixed(2)});"></div>
      <span style="font-size:10px;color:var(--gray-400);">${day}</span>
    </div>`;
  }).join('');

  const content = `
    <header class="page-header" style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><h2 class="page-title">Reports</h2><p class="page-subtitle">Your financial summary and insights.</p></div>
        <form method="GET" action="/reports" style="display:flex;gap:8px;align-items:center;">
          <input type="month" name="month" value="${esc(month || currentMonth())}" class="form-control" style="width:160px;">
          <button type="submit" class="btn btn-primary">View</button>
        </form>
      </div>
    </header>

    <!-- Summary cards -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
      <div class="card" style="text-align:center;">
        <p style="font-size:12px;color:var(--gray-500);margin:0 0 4px;">Income</p>
        <p style="font-size:22px;font-weight:800;color:#16a34a;margin:0;">SAR ${fmt(income)}</p>
      </div>
      <div class="card" style="text-align:center;">
        <p style="font-size:12px;color:var(--gray-500);margin:0 0 4px;">Expenses</p>
        <p style="font-size:22px;font-weight:800;color:#dc2626;margin:0;">SAR ${fmt(expenses)}</p>
      </div>
      <div class="card" style="text-align:center;">
        <p style="font-size:12px;color:var(--gray-500);margin:0 0 4px;">Net</p>
        <p style="font-size:22px;font-weight:800;color:${net >= 0 ? '#16a34a' : '#dc2626'};margin:0;">${net >= 0 ? '+' : ''}SAR ${fmt(net)}</p>
      </div>
    </div>

    <!-- AI Story Report -->
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;">AI Story Report</h3>
        <button id="storyBtn" onclick="loadStoryReport()" class="btn btn-ghost" style="font-size:13px;">
          Generate ✨
        </button>
      </div>
      <div id="storyContent" style="font-size:14px;color:var(--gray-700);line-height:1.6;">
        <p style="color:var(--gray-400);">Click "Generate" for an AI-written narrative of your spending this month.</p>
      </div>
    </div>

    <!-- Spending by Category -->
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;">Spending by Category</h3>
      ${catBars}
    </div>

    <!-- Daily Spending Heatmap -->
    ${days.length > 0 ? `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;">Daily Spending</h3>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${dailyBars}
      </div>
      <p style="font-size:12px;color:var(--gray-400);margin:12px 0 0;">Darker = more spent that day.</p>
    </div>` : ''}

    <script>
    async function loadStoryReport() {
      const btn = document.getElementById('storyBtn');
      const content = document.getElementById('storyContent');
      btn.disabled = true;
      btn.textContent = 'Generating…';
      content.innerHTML = '<div style="display:flex;gap:8px;align-items:center;color:var(--gray-400);"><div class="skeleton" style="width:100%;height:60px;border-radius:8px;"></div></div>';
      try {
        const res = await fetch('/api/story?month=${esc(month || currentMonth())}');
        const data = await res.json();
        if (data.story) {
          content.innerHTML = data.story.split('\\n').map(p => p ? '<p style="margin:0 0 10px;">'+p+'</p>' : '').join('');
        } else {
          content.textContent = 'Could not generate report.';
        }
      } catch(e) {
        content.textContent = 'Error loading report.';
      }
      btn.disabled = false;
      btn.textContent = 'Regenerate ✨';
    }
    </script>`;

  return baseLayout({ title: 'Reports', activePage: 'reports', content, user, flash });
}
