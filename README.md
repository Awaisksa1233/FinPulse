# 💰 FinPulse - Smart Financial Core

<p align="center">
  <img src="static/icons/icon-512.png" alt="FinPulse Logo" width="120" height="120">
</p>

<p align="center">
  <strong>AI-Powered Personal Finance Manager</strong><br>
  Track expenses, manage loans, chat with AI, and gain financial insights — all in one beautiful app.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-blue?style=flat-square&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.1-green?style=flat-square&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/AI-Groq-purple?style=flat-square" alt="AI Powered">
  <img src="https://img.shields.io/badge/PWA-Enabled-orange?style=flat-square" alt="PWA">
  <img src="https://img.shields.io/badge/Telegram-Bot-blue?style=flat-square&logo=telegram" alt="Telegram">
</p>

---

## 🌐 Live Demo

> **Try FinPulse now without any setup!**

| Platform | Link |
|----------|------|
| 🖥️ **Web App** | [awaisAI.pythonanywhere.com](https://awaisAI.pythonanywhere.com) |
| 🤖 **Telegram Bot** | [@Awaisexpensebot](https://t.me/Awaisexpensebot) |

---

## ✨ Features

### 📊 **Dashboard & Analytics**
- Real-time financial overview with beautiful charts
- Monthly income/expense tracking
- Expense breakdown by category
- AI-generated financial summaries and story reports

### 💳 **Multi-Account Management**
- Support for Cash, Bank, and Mobile Money accounts
- Track balances across all accounts
- Easy transfers between accounts

### 📝 **Transaction Tracking**
- Record income and expenses with categories
- Support for recurring transactions
- Natural language transaction input via AI
- Edit and delete transactions with automatic balance updates
- **Pagination** for large transaction lists (15 per page)

### 💸 **Loan Management**
- Track money you've lent (receivables) and borrowed (payables)
- Loan accounts with multiple entries per person
- Payment recording and balance tracking
- AI-powered loan summaries

### 🤖 **AI-Powered Features**
- **Natural Language Processing**: Add transactions by typing naturally
- **Smart Summaries**: Get AI-generated insights about your finances
- **Story Mode Reports**: Transform your financial data into engaging narratives
- **Chat Interface**: Ask questions about your finances
- **AI Budget Suggestions**: Get personalized budget recommendations based on spending patterns

### 📱 **Mobile & PWA**
- Progressive Web App (PWA) support
- Install on iOS and Android home screens
- Offline-capable with service worker
- Responsive design for all screen sizes

### 📲 **Telegram Integration**
- Link your Telegram account
- Add transactions via Telegram bot
- Receive daily financial reports
- Login via Telegram code

### 📈 **Reports & Insights**
- Monthly and yearly financial reports
- Income vs. expense analysis
- Net worth calculation
- Category-wise spending breakdown

### 🔐 **Security & Admin**
- Secure user authentication
- Admin panel for user management
- Maintenance mode support
- Failed login tracking

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Awaisksa1233/FinPulse.git
   cd FinPulse
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key-here
   GROQ_API_KEY=your-groq-api-key
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   ADMIN_PIN=your-admin-pin
   ```

5. **Initialize the database**
   ```bash
   python setup_db.py
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Open in browser**
   ```
   http://localhost:5000
   ```

---

## 📁 Project Structure

```
FinPulse/
├── app.py                 # Main Flask application
├── models.py              # Database models
├── requirements.txt       # Python dependencies
├── setup_db.py           # Database initialization
├── migrate_loans.py      # Loan migration utility
│
├── services/
│   ├── groq_service.py        # AI integration (Groq)
│   ├── telegram_service.py    # Telegram bot
│   ├── daily_report_service.py # Scheduled reports
│   └── local_ai_service.py    # Local AI fallback
│
├── static/
│   ├── style.css         # Main stylesheet
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # App icons
│
└── templates/
    ├── base.html         # Base template
    ├── dashboard.html    # Dashboard page
    ├── accounts.html     # Account management
    ├── transactions.html # Income/Expense pages
    ├── loans.html        # Loan management
    ├── reports.html      # Financial reports
    ├── chat.html         # AI chat interface
    ├── admin.html        # Admin panel
    ├── auth.html         # Login/Register
    ├── telegram.html     # Telegram linking
    └── shortcut.html     # iOS Shortcut setup
```

---

## 🔌 API Endpoints

### Transaction API
```http
POST /api/transaction
Content-Type: application/json

{
  "amount": 50.00,
  "type": "expense",
  "category": "Food",
  "description": "Lunch",
  "account": "Cash",
  "date": "2024-01-15"
}
```

### AI Natural Language API
```http
POST /api/ai
Content-Type: application/json

{
  "text": "Paid 50 for lunch at McDonalds"
}
```

### Get Accounts
```http
GET /api/accounts
```

### AI Summary
```http
GET /api/summary
```

### Story Report
```http
GET /api/story?timeframe=monthly&year=2024&month=12
```

---

## 📱 iOS Shortcut Integration

FinPulse supports iOS Shortcuts for quick transaction entry:

1. Open the app and navigate to the Shortcut page
2. Follow the setup instructions
3. Create a shortcut that sends transactions via the API
4. Add the shortcut to your home screen for one-tap expense tracking

---

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and link account |
| `/link` | Link Telegram to FinPulse account |
| `/login` | Get web login code |
| `/balance` | Check account balances |
| `/add` | Add a transaction |
| `/report` | Get daily/monthly report |
| `/help` | Show available commands |

---

## 🛠️ Tech Stack

- **Backend**: Flask 3.1, SQLAlchemy
- **Database**: SQLite
- **AI**: Groq API (LLaMA-based models)
- **Authentication**: Flask-Login
- **Styling**: Vanilla CSS with modern design
- **PWA**: Service Worker, Web App Manifest
- **Bot**: Telegram Bot API

---

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Flask secret key for sessions | Yes |
| `GROQ_API_KEY` | Groq API key for AI features | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | No |
| `ADMIN_PIN` | PIN for admin access | No |
| `MAINTENANCE_MODE` | Enable maintenance mode | No |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

**Awais** - [@Awaisksa1233](https://github.com/Awaisksa1233)

Project Link: [https://github.com/Awaisksa1233/FinPulse](https://github.com/Awaisksa1233/FinPulse)

---

<p align="center">
  Made with ❤️ for better financial management
</p>
