import { describe, it, expect } from 'vitest';
import { dashboardPage } from '../src/templates/dashboard.js';
import { baseLayout } from '../src/templates/base.js';

describe('Mobile-First Templates Suite', () => {
  it('renders base layout with mobile header, frosted bottom nav, and quick add sheet', () => {
    const html = baseLayout({
      title: 'Dashboard',
      activePage: 'dashboard',
      content: '<div>Test Content</div>',
      user: { full_name: 'Awais Khan', email: 'test@example.com' }
    });

    // Check mobile-first components
    expect(html).toContain('mobile-header');
    expect(html).toContain('mobile-header-btn');
    expect(html).toContain('togglePrivacy');
    expect(html).toContain('bottom-nav');
    expect(html).toContain('bottom-nav-center-btn');
    expect(html).toContain('openQuickAddSheet');
    expect(html).toContain('id="quickAddSheet"');
    expect(html).toContain('qa-numpad');
    expect(html).toContain('qaNum');
    expect(html).toContain('qaCommit');
  });

  it('renders dashboard with hero net worth, thumb actions, and accounts carousel', () => {
    const html = dashboardPage({
      user: { full_name: 'Awais Khan', email: 'test@example.com' },
      accounts: [
        { id: 1, name: 'Main Checking', type: 'bank', balance: 5000 },
        { id: 2, name: 'Vault', type: 'savings', balance: 10000 }
      ],
      income: 8000,
      expenses: 3000,
      totalBalance: 15000,
      recentTransactions: [
        { id: 10, type: 'expense', amount: 45, category: 'Food & Dining', date: '2026-11-18', account_name: 'Main Checking' }
      ],
      budgetProgress: [
        { category: 'Food & Dining', spent: 450, monthly_limit: 800, progress_pct: 56, status: 'ok' }
      ]
    });

    expect(html).toContain('Total Net Worth');
    expect(html).toContain('privacy-val');
    expect(html).toContain('thumb-actions-grid');
    expect(html).toContain('accounts-carousel');
    expect(html).toContain('Main Checking');
    expect(html).toContain('Vault');
    expect(html).toContain('🍔');
  });
});
