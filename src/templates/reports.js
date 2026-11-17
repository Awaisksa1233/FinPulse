import { baseLayout, esc, fmt, currentMonth } from './base.js';

export function reportsPage({
  user,
  month = currentMonth(),
  income = 0,
  expenses = 0,
  totalNetWorth = 0,
  categorySpend = {},
  categoryIncome = {},
  dailySpend = {},
  flash = []
}) {
  const net = income - expenses;
  const categories = Object.entries(categorySpend || {}).sort((a, b) => b[1] - a[1]);
  const maxSpend = categories[0]?.[1] || 1;

  // Month navigation calculation
  const [currYear, currMon] = (month || currentMonth()).split('-').map(Number);
  const prevDate = new Date(currYear, currMon - 2, 1);
  const nextDate = new Date(currYear, currMon, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = new Date(currYear, currMon - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const catBars = categories.length ? categories.map(([cat, amount]) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
        <span style="font-weight:600;color:var(--text);">${esc(cat)}</span>
        <span style="color:var(--text-muted);font-weight:500;">SAR ${fmt(amount)} (${Math.round((amount / (expenses || 1)) * 100)}%)</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill danger" style="width:${Math.round((amount / maxSpend) * 100)}%;"></div>
      </div>
    </div>`).join('') : '<p style="color:var(--text-light);font-size:14px;text-align:center;padding:24px 0;">No spending data recorded for this month.</p>';

  // Mini calendar heatmap-style daily bars
  const days = Object.entries(dailySpend || {}).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...days.map(([, v]) => v), 1);
  const dailyBars = days.map(([date, amount]) => {
    const opacity = 0.18 + (amount / maxDay) * 0.82;
    const day = date.split('-')[2];
    return `
    <div title="${date}: SAR ${fmt(amount)}" style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;">
      <div style="width:32px;height:32px;border-radius:6px;background:rgba(37,99,235,${opacity.toFixed(2)});border:1px solid rgba(37,99,235,.25);display:flex;align-items:center;justify-content:center;transition:transform .15s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        <span style="font-size:10px;font-weight:700;color:${opacity > 0.5 ? 'white' : 'var(--text)'};">${parseInt(day, 10)}</span>
      </div>
    </div>`;
  }).join('');

  const expLabels = Object.keys(categorySpend || {});
  const expValues = Object.values(categorySpend || {});
  const incLabels = Object.keys(categoryIncome || {});
  const incValues = Object.values(categoryIncome || {});

  const content = `
    <!-- Page Header & Timeframe / Month Controls -->
    <header class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 class="page-title">Analytics & Reports</h2>
        <p class="page-subtitle">Deep dive into your cash flow and financial health.</p>
      </div>
      <div class="report-controls" style="margin-bottom:0;">
        <div class="date-navigation">
          <a href="/reports?month=${prevMonthStr}" class="date-nav-btn" title="Previous Month">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <span class="date-display">${esc(monthName)}</span>
          <a href="/reports?month=${nextMonthStr}" class="date-nav-btn" title="Next Month">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
        <form method="GET" action="/reports" style="display:flex;gap:8px;align-items:center;">
          <input type="month" name="month" value="${esc(month)}" class="form-control" style="width:150px;font-size:13px;" onchange="this.form.submit()">
        </form>
      </div>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <!-- Net Worth & Cash Flow Hero Card -->
      <div class="networth-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;">
          <div>
            <p class="networth-label">Total Liquid Net Worth</p>
            <h3 class="networth-value">${fmt(totalNetWorth)} <span style="font-size:20px;font-weight:600;opacity:.55;">SAR</span></h3>
          </div>
          <div style="text-align:right;">
            <p style="color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:.6px;">Month Net Cash Flow</p>
            <p style="font-weight:800;color:${net >= 0 ? '#4ade80' : '#f87171'};font-size:24px;margin:2px 0 0;">
              ${net >= 0 ? '+' : ''}SAR ${fmt(net)}
            </p>
          </div>
        </div>
      </div>

      <!-- Monthly Summary Stat Cards -->
      <div class="summary-grid" style="margin-bottom:24px;">
        <div class="summary-card success-card">
          <p class="summary-label">Monthly Income</p>
          <h3 class="summary-value">${fmt(income)} SAR</h3>
          <div class="summary-trend positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            ${esc(monthName)}
          </div>
        </div>

        <div class="summary-card danger-card">
          <p class="summary-label">Monthly Expenses</p>
          <h3 class="summary-value">${fmt(expenses)} SAR</h3>
          <div class="summary-trend negative">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
            ${esc(monthName)}
          </div>
        </div>

        <div class="summary-card accent">
          <p class="summary-label">Net Savings</p>
          <h3 class="summary-value">${fmt(net)} SAR</h3>
          <div class="summary-trend">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ${income > 0 ? Math.round((net / income) * 100) + '% saved' : '0% saved'}
          </div>
        </div>
      </div>

      <!-- AI Story Mode Card -->
      <div class="story-card" id="storyCard">
        <button class="story-refresh-btn" onclick="loadStoryReport()" id="storyBtn" title="Generate new AI narrative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <div class="story-header">
          <div class="story-icon">📖</div>
          <div>
            <div class="story-title">AI Financial Story</div>
            <div class="story-subtitle">Intelligent narrative review for ${esc(monthName)}</div>
          </div>
        </div>
        <div class="story-content" id="storyContent">
          <div class="ai-summary-skeleton">
            <div class="skeleton skeleton-text" style="width:95%;height:16px;margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text" style="width:85%;height:16px;margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text" style="width:70%;height:16px;"></div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid reports-charts-grid" style="margin-bottom:24px;">
        <!-- Cash Flow Comparison Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Cash Flow Comparison</h3>
            <span class="badge ${net >= 0 ? 'badge-success' : 'badge-danger'}">
              ${net >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div class="chart-container" style="height:260px;">
            <canvas id="cashFlowBarChart"></canvas>
          </div>
        </div>

        <!-- Doughnut: Expense Categories -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Expense Distribution</h3>
          </div>
          ${expLabels.length > 0 ? `
          <div class="chart-container" style="height:260px;">
            <canvas id="expenseDoughnutChart"></canvas>
          </div>` : `
          <div style="text-align:center;padding:48px 16px;color:var(--text-light);">
            <p>No expenses to chart</p>
          </div>`}
        </div>
      </div>

      <!-- Spending Breakdown Bars -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">Spending by Category</h3>
          <span style="font-size:12px;color:var(--text-muted);">${categories.length} categories</span>
        </div>
        ${catBars}
      </div>

      <!-- Daily Spending Heatmap -->
      ${days.length > 0 ? `
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">Daily Spending Heatmap</h3>
          <span style="font-size:12px;color:var(--text-muted);">Darker blue = higher daily spending</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;">
          ${dailyBars}
        </div>
      </div>` : ''}
    </div>`;

  const chartPayload = JSON.stringify({
    income,
    expenses,
    net,
    expLabels,
    expValues,
    incLabels,
    incValues
  });

  const scripts = `
  <script>
    // Story report loader
    async function loadStoryReport() {
      const btn = document.getElementById('storyBtn');
      const content = document.getElementById('storyContent');
      if (btn) btn.disabled = true;
      content.innerHTML = '<div class="ai-summary-skeleton"><div class="skeleton skeleton-text" style="width:95%;height:16px;margin-bottom:8px;"></div><div class="skeleton skeleton-text" style="width:80%;height:16px;margin-bottom:8px;"></div><div class="skeleton skeleton-text" style="width:60%;height:16px;"></div></div>';
      try {
        const res = await fetch('/api/story?month=${esc(month)}');
        const data = await res.json();
        if (data.story) {
          content.innerHTML = data.story.split('\\n').filter(Boolean).map(p => '<p style="margin:0 0 10px;line-height:1.7;">' + p + '</p>').join('');
        } else {
          content.innerHTML = '<p style="margin:0;opacity:.8;">No story report could be generated for this period.</p>';
        }
      } catch (err) {
        content.innerHTML = '<p style="margin:0;opacity:.8;">Failed to load story report. Please try again.</p>';
      } finally {
        if (btn) btn.disabled = false;
      }
    }
    loadStoryReport();

    // Chart.js renderers
    (function() {
      const data = ${chartPayload};

      // 1. Cash flow bar chart
      const barCanvas = document.getElementById('cashFlowBarChart');
      if (barCanvas) {
        new Chart(barCanvas, {
          type: 'bar',
          data: {
            labels: ['Income', 'Expenses', 'Net Savings'],
            datasets: [{
              data: [data.income, data.expenses, data.net],
              backgroundColor: ['#16a34a', '#dc2626', data.net >= 0 ? '#2563eb' : '#f59e0b'],
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 44
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    return ' SAR ' + Number(ctx.raw || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                  }
                }
              }
            },
            scales: {
              y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  font: { family: 'Inter', size: 11 },
                  callback: function(v) { return 'SAR ' + v; }
                }
              },
              x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 12, weight: '600' } }
              }
            }
          }
        });
      }

      // 2. Expense Doughnut chart
      const doughnutCanvas = document.getElementById('expenseDoughnutChart');
      if (doughnutCanvas && data.expLabels.length > 0) {
        const palette = ['#2563eb', '#0d9488', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];
        new Chart(doughnutCanvas, {
          type: 'doughnut',
          data: {
            labels: data.expLabels,
            datasets: [{
              data: data.expValues,
              backgroundColor: palette.slice(0, data.expLabels.length),
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  font: { family: 'Inter', size: 11 },
                  color: '#64748b',
                  padding: 8
                }
              },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    return ' ' + ctx.label + ': SAR ' + Number(ctx.raw || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                  }
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    })();
  </script>`;

  return baseLayout({
    title: `Reports (${monthName})`,
    activePage: 'reports',
    content,
    scripts,
    user,
    flash
  });
}
