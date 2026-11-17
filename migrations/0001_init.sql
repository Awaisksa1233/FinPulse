-- FinPulse D1 Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  api_token TEXT UNIQUE,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',  -- cash | bank | mobile
  balance REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,          -- income | expense | transfer
  category TEXT NOT NULL DEFAULT 'Other',
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  description TEXT,
  budget_month TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  alert_threshold REAL NOT NULL DEFAULT 0.8,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recurring_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- income | expense
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  amount REAL NOT NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- daily | weekly | monthly | yearly
  start_date TEXT NOT NULL,
  next_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_account_id INTEGER NOT NULL REFERENCES loan_accounts(id) ON DELETE CASCADE,
  amount REAL NOT NULL,  -- positive = lent/paid out, negative = repaid/received back
  note TEXT,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,    -- user | assistant
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  telegram_chat_id TEXT UNIQUE,
  telegram_username TEXT,
  link_code TEXT UNIQUE,
  daily_report_enabled INTEGER NOT NULL DEFAULT 0,
  daily_report_time TEXT NOT NULL DEFAULT '08:00',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(budget_month);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_entries_account ON loan_entries(loan_account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON recurring_templates(next_date);
CREATE INDEX IF NOT EXISTS idx_telegram_chat ON telegram_users(telegram_chat_id);
