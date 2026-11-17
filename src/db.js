/**
 * D1 database helpers — curried: db(DB).method(args)
 * Column names match migrations/0001_init.sql exactly.
 */
export const db = (DB) => ({

  // ── Users ──────────────────────────────────────────────────────────
  async getUserById(id) {
    return (await DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()) || null;
  },
  async getUserByEmail(email) {
    return (await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()) || null;
  },
  async createUser({ email, password_hash, full_name }) {
    const r = await DB.prepare(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?,?,?) RETURNING id'
    ).bind(email, password_hash, full_name || null).first();
    return r.id;
  },
  async getAllUsers() {
    const r = await DB.prepare('SELECT id,email,full_name,is_admin,created_at FROM users ORDER BY created_at DESC').all();
    return r.results;
  },

  // ── Accounts ───────────────────────────────────────────────────────
  async getAccounts(userId) {
    const r = await DB.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY name').bind(userId).all();
    return r.results;
  },
  async createAccount({ user_id, name, type, balance, color }) {
    await DB.prepare('INSERT INTO accounts (user_id,name,type,balance,color) VALUES (?,?,?,?,?)')
      .bind(user_id, name, type || 'bank', balance || 0, color || '#6366f1').run();
  },
  async updateAccount(id, { name, color }) {
    await DB.prepare('UPDATE accounts SET name=?,color=? WHERE id=?').bind(name, color, id).run();
  },
  async deleteAccount(id, userId) {
    await DB.prepare('DELETE FROM accounts WHERE id=? AND user_id=?').bind(id, userId).run();
  },
  async adjustBalance(accountId, delta) {
    await DB.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').bind(delta, accountId).run();
  },

  // ── Transactions ───────────────────────────────────────────────────
  async getTransactions(userId, typeFilter) {
    let sql = 'SELECT t.*, a.name as account_name FROM transactions t LEFT JOIN accounts a ON t.account_id=a.id WHERE t.user_id=?';
    const params = [userId];
    if (typeFilter && typeFilter !== 'all') {
      sql += ' AND t.type=?'; params.push(typeFilter);
    }
    sql += ' ORDER BY t.date DESC, t.id DESC LIMIT 200';
    const r = await DB.prepare(sql).bind(...params).all();
    return r.results;
  },
  async createTransaction({ user_id, type, amount, account_id, category, description, date, budget_month }) {
    await DB.prepare(
      'INSERT INTO transactions (user_id,type,amount,account_id,category,description,date,budget_month) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(user_id, type, amount, account_id, category || 'Other', description || '', date, budget_month).run();
  },
  async deleteTransactionById(id, userId) {
    await DB.prepare('DELETE FROM transactions WHERE id=? AND user_id=?').bind(id, userId).run();
  },

  // ── Budgets ────────────────────────────────────────────────────────
  async getBudgets(userId) {
    const r = await DB.prepare('SELECT * FROM budgets WHERE user_id=? ORDER BY category').bind(userId).all();
    return r.results;
  },
  async createBudget({ user_id, category, monthly_limit, alert_threshold }) {
    await DB.prepare('INSERT INTO budgets (user_id,category,monthly_limit,alert_threshold) VALUES (?,?,?,?)')
      .bind(user_id, category, monthly_limit, alert_threshold || 0.8).run();
  },
  async updateBudget(id, { category, monthly_limit, alert_threshold }) {
    await DB.prepare('UPDATE budgets SET category=?,monthly_limit=?,alert_threshold=? WHERE id=?')
      .bind(category, monthly_limit, alert_threshold, id).run();
  },
  async deleteBudget(id, userId) {
    await DB.prepare('DELETE FROM budgets WHERE id=? AND user_id=?').bind(id, userId).run();
  },

  // ── Recurring ──────────────────────────────────────────────────────
  async getRecurring(userId) {
    const r = await DB.prepare(
      'SELECT r.*,a.name as account_name FROM recurring_templates r LEFT JOIN accounts a ON r.account_id=a.id WHERE r.user_id=? AND r.is_active=1 ORDER BY r.next_date'
    ).bind(userId).all();
    return r.results;
  },
  async createRecurring({ user_id, type, description, category, amount, account_id, frequency, start_date, next_date }) {
    await DB.prepare(
      'INSERT INTO recurring_templates (user_id,type,description,category,amount,account_id,frequency,start_date,next_date) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(user_id, type, description, category, amount, account_id, frequency, start_date, next_date || start_date).run();
  },
  async deleteRecurring(id, userId) {
    await DB.prepare('DELETE FROM recurring_templates WHERE id=? AND user_id=?').bind(id, userId).run();
  },

  // ── Loans ──────────────────────────────────────────────────────────
  async getLoanAccounts(userId) {
    const r = await DB.prepare('SELECT * FROM loan_accounts WHERE user_id=? ORDER BY person_name').bind(userId).all();
    return r.results;
  },
  async getLoanAccount(id, userId) {
    return (await DB.prepare('SELECT * FROM loan_accounts WHERE id=? AND user_id=?').bind(id, userId).first()) || null;
  },
  async createLoanAccount({ user_id, person_name, description }) {
    const r = await DB.prepare(
      'INSERT INTO loan_accounts (user_id,person_name,description) VALUES (?,?,?) RETURNING id'
    ).bind(user_id, person_name, description || '').first();
    return r.id;
  },
  async deleteLoanAccount(id, userId) {
    await DB.prepare('DELETE FROM loan_accounts WHERE id=? AND user_id=?').bind(id, userId).run();
  },
  async getLoanEntries(loanAccountId) {
    const r = await DB.prepare('SELECT * FROM loan_entries WHERE loan_account_id=? ORDER BY date DESC, id DESC').bind(loanAccountId).all();
    return r.results;
  },
  async createLoanEntry({ loan_account_id, amount, note, date }) {
    await DB.prepare('INSERT INTO loan_entries (loan_account_id,amount,note,date) VALUES (?,?,?,?)')
      .bind(loan_account_id, amount, note || '', date).run();
  },
  async deleteLoanEntry(id, loanAccountId) {
    await DB.prepare('DELETE FROM loan_entries WHERE id=? AND loan_account_id=?').bind(id, loanAccountId).run();
  },

  // ── Chat ───────────────────────────────────────────────────────────
  async getChatHistory(userId, limit = 50) {
    const r = await DB.prepare('SELECT * FROM chat_messages WHERE user_id=? ORDER BY created_at ASC LIMIT ?').bind(userId, limit).all();
    return r.results;
  },
  async addChatMessage(userId, role, content) {
    await DB.prepare('INSERT INTO chat_messages (user_id,role,content) VALUES (?,?,?)').bind(userId, role, content).run();
  },
  async clearChatHistory(userId) {
    await DB.prepare('DELETE FROM chat_messages WHERE user_id=?').bind(userId).run();
  },

  // ── Telegram ───────────────────────────────────────────────────────
  async getTelegramUser(userId) {
    return (await DB.prepare('SELECT * FROM telegram_users WHERE user_id=?').bind(userId).first()) || null;
  },
  async getTelegramUserByChatId(chatId) {
    return (await DB.prepare('SELECT * FROM telegram_users WHERE telegram_chat_id=?').bind(chatId).first()) || null;
  },
  async saveTelegramUser({ user_id, telegram_chat_id, telegram_username, daily_report_enabled, daily_report_time }) {
    await DB.prepare(`
      INSERT INTO telegram_users (user_id,telegram_chat_id,telegram_username,daily_report_enabled,daily_report_time)
      VALUES (?,?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET
        telegram_chat_id=excluded.telegram_chat_id,
        telegram_username=excluded.telegram_username
    `).bind(user_id, telegram_chat_id, telegram_username || '', daily_report_enabled ? 1 : 0, daily_report_time || '08:00').run();
  },
  async deleteTelegramUser(userId) {
    await DB.prepare('DELETE FROM telegram_users WHERE user_id=?').bind(userId).run();
  },
  async updateTelegramSettings(userId, { report_time, enabled }) {
    await DB.prepare('UPDATE telegram_users SET daily_report_time=?,daily_report_enabled=? WHERE user_id=?')
      .bind(report_time, enabled ? 1 : 0, userId).run();
  },

  // ── Analytics ──────────────────────────────────────────────────────
  async getMonthlyTotals(userId, month) {
    const r = await DB.prepare(`
      SELECT
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM transactions WHERE user_id=? AND budget_month=?
    `).bind(userId, month).first();
    return { income: r?.income || 0, expenses: r?.expenses || 0 };
  },
  async getCategorySpend(userId, month) {
    const r = await DB.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions WHERE user_id=? AND type='expense' AND budget_month=?
      GROUP BY category ORDER BY total DESC
    `).bind(userId, month).all();
    // Return as plain object { category: amount }
    const map = {};
    for (const row of r.results) map[row.category] = row.total;
    return map;
  },
  async getRecentTransactions(userId, limit = 10) {
    const r = await DB.prepare(`
      SELECT t.*,a.name as account_name FROM transactions t
      LEFT JOIN accounts a ON t.account_id=a.id
      WHERE t.user_id=? ORDER BY t.date DESC, t.id DESC LIMIT ?
    `).bind(userId, limit).all();
    return r.results;
  },
});
