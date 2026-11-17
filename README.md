# FinPulse 💳⚡

**FinPulse** is a lightweight, high-performance personal financial dashboard and smart financial core built to run **100% natively on Cloudflare Workers**.

Powered by [Hono](https://hono.dev), Cloudflare **D1** (serverless SQL), Cloudflare **KV** (session store & caching), and AI financial insights (via Groq / OpenRouter).

---

## 🚀 Key Features

* **Accounts & Cash Flow:** Track multiple accounts, balances, income, and expenses with instant category analytics.
* **Smart Categorization & Budgets:** Monthly budget limits, threshold alerts, and spending breakdowns.
* **Recurring Transactions & Loans:** Automated cron triggers for recurring expenses and debt/loan tracking.
* **AI Advisor & Natural Chat:** In-app financial insights and conversational expense entry powered by Groq (LLaMA 3.3) and OpenRouter.
* **Telegram Integration:** Daily scheduled financial reports and transaction entry via Telegram Bot.
* **Serverless Architecture:** Sub-millisecond cold starts with zero server maintenance overhead.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Runtime & Edge** | [Cloudflare Workers](https://workers.cloudflare.com/) |
| **Web Framework** | [Hono v4](https://hono.dev/) |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge) |
| **Sessions & KV** | Cloudflare KV (`SESSIONS`) |
| **Security** | Web Crypto PBKDF2 Password Hashing & HttpOnly session cookies |
| **AI Inference** | Groq API (`llama-3.3-70b`) & OpenRouter fallback |
| **Testing** | [Vitest](https://vitest.dev/) |

---

## 📦 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (included in `devDependencies`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Local Development
Start the local Worker dev server:
```bash
npm run dev
```

### 4. Run Automated Tests
Execute the unit and route test suite with Vitest:
```bash
npm test
```

---

## 🗄️ Database Setup & Migrations

FinPulse utilizes Cloudflare D1. Initialize and apply migrations to your local or remote D1 database:

**Local D1 migration:**
```bash
npx wrangler d1 migrations apply finpulse --local
```

**Remote D1 migration (Production):**
```bash
npm run db:migrate
```

---

## 🔐 Environment Secrets Configuration

Configure your production secrets via Wrangler:

```bash
# Required: Secret key for signing sessions
npx wrangler secret put SECRET_KEY

# Optional: AI Provider (Groq or OpenRouter)
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put OPENROUTER_API_KEY

# Optional: Admin access PIN & Telegram Bot
npx wrangler secret put ADMIN_PIN
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

---

## 🚢 Deployment

Deploy directly to Cloudflare's global edge network:

```bash
npm run deploy
```

The app will build static PWA assets, bundle the Hono application, and publish to your Cloudflare Workers subdomain.
