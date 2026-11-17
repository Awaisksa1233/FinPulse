// Groq API service (uses native fetch, no SDK needed in Workers)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function groqChat(apiKey, messages, jsonMode = false) {
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');
  const body = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateAISummary(apiKey, { accounts, income, expenses, topCategories }) {
  const prompt = `You are a personal finance AI for a user in Saudi Arabia (currency: SAR).
Data: ${accounts.length} accounts, total balance SAR ${accounts.reduce((s, a) => s + a.balance, 0).toFixed(2)}.
This month: income SAR ${income.toFixed(2)}, expenses SAR ${expenses.toFixed(2)}.
Top categories: ${topCategories.map(c => `${c.category} SAR ${c.total.toFixed(2)}`).join(', ')}.
Give a 2-3 sentence insightful financial summary with one actionable tip. Be direct and friendly.`;

  return groqChat(apiKey, [{ role: 'user', content: prompt }]);
}

export async function processChat(apiKey, { userMessage, history, accounts, recentTransactions, currentMonth }) {
  const systemPrompt = `You are FinPulse AI, a personal finance assistant for a user in Saudi Arabia (SAR).
You help analyze finances, add transactions, and answer questions.

Current data:
- Accounts: ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance, type: a.type })))}
- Recent transactions (last 10): ${JSON.stringify(recentTransactions.map(t => ({ date: t.date, amount: t.amount, type: t.type, category: t.category, account: t.account_name })))}
- Current month: ${currentMonth}

When the user wants to add a transaction, respond with JSON: {"action":"transaction","amount":X,"type":"income|expense","category":"...","account_id":X,"description":"...","date":"YYYY-MM-DD"}
When they want a transfer, respond with JSON: {"action":"transfer","amount":X,"from_account_id":X,"to_account_id":X,"description":"..."}
When they want to add a loan entry, respond with JSON: {"action":"loan","amount":X,"description":"...","date":"YYYY-MM-DD"}
Otherwise respond with plain text analysis. Keep responses concise and helpful.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  return groqChat(apiKey, messages);
}

export async function generateStoryReport(apiKey, { monthlyData, topCategories, accountSummary, currentMonth }) {
  const prompt = `You are a financial storyteller. Create a brief narrative financial report for ${currentMonth} in SAR.
Income: ${monthlyData.income.toFixed(2)}, Expenses: ${monthlyData.expense.toFixed(2)}.
Top spend: ${topCategories.slice(0, 5).map(c => `${c.category} (${c.total.toFixed(0)})`).join(', ')}.
Accounts: ${accountSummary}.
Write 3-4 engaging sentences summarizing the month's financial story. Use emojis sparingly.`;

  return groqChat(apiKey, [{ role: 'user', content: prompt }]);
}

export async function generateBudgetSuggestions(apiKey, { spending, currentBudgets }) {
  const prompt = `Based on this spending in SAR: ${JSON.stringify(spending)}.
Current budgets: ${JSON.stringify(currentBudgets.map(b => ({ category: b.category, limit: b.monthly_limit })))}.
Suggest 3-5 budget categories with reasonable monthly limits in SAR as JSON array: [{"category":"...","suggested_limit":X,"reason":"..."}]`;

  const text = await groqChat(apiKey, [{ role: 'user', content: prompt }], true);
  try { return JSON.parse(text); } catch { return []; }
}
