# FinPulse

A personal finance tracker: accounts, income & expenses, budgets, recurring
transactions, loans/debts, reports, CSV export, and an optional AI assistant and
Telegram bot. Installable on your phone as a PWA.

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # optional, then edit
python app.py
```

Open http://127.0.0.1:5000, click **Sign up** (email form), create your account,
then add an account (e.g. "Cash" or your bank) and start logging income/expenses.
Tables are created automatically on first run; data lives in `instance/finpulse.db`
(SQLite) unless you set `DATABASE_URL` (e.g. MySQL).

## Using it day to day

1. **Accounts** – add each place your money sits; set the opening balance.
2. **Income / Expenses** – log transactions; balances update automatically.
3. **Budgets** – set monthly limits per category and watch progress on the dashboard.
4. **Recurring** – rent, salary, subscriptions are posted automatically when due.
5. **Loans & Debts** – track money lent to / borrowed from people.
6. **Reports** – monthly/yearly breakdowns. **Export transactions (CSV)** for backup or Excel.

## Use it on your phone

Run with `FLASK_HOST=0.0.0.0 python app.py`, open `http://<your-computer-ip>:5000`
on the same Wi-Fi, and use "Add to Home Screen". For access away from home, deploy it
to a host you control (and set a strong `SECRET_KEY` and `ADMIN_PIN`).

## Security notes

- Set `ADMIN_PIN` in `.env` – the built-in default is public.
- After creating your account, set `REGISTRATION_OPEN=false` (or use the admin page)
  so nobody else can sign up.
- Back up `instance/finpulse.db` (or use the CSV export) regularly.

## Optional features

- **AI insights/chat**: set `GROQ_API_KEY` (see `.env.example`).
- **Telegram bot**: configure from the Telegram page inside the app.

## Tests

```bash
pip install pytest && python -m pytest
```
