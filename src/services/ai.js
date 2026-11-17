// AI service supporting OpenRouter and Groq APIs
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Models to try (handles free tiers and custom models)
const OPENROUTER_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-3-1.7b:free',
  'meta-llama/llama-3.3-70b-instruct'
];

async function callAi(apiKey, messages, options = {}) {
  const key = apiKey || '';
  if (!key) throw new Error('AI API key (OPENROUTER_API_KEY or GROQ_API_KEY) not configured');

  const isOpenRouter = key.startsWith('sk-or-') || !key.startsWith('gsk_');
  const url = isOpenRouter ? OPENROUTER_URL : GROQ_URL;
  const models = isOpenRouter
    ? (options.model ? [options.model] : OPENROUTER_MODELS)
    : [options.model || 'llama-3.3-70b-versatile'];

  let lastError = null;

  for (const model of models) {
    try {
      const headers = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      };
      if (isOpenRouter) {
        headers['HTTP-Referer'] = 'https://finpulse.awaisibrahim6.workers.dev';
        headers['X-Title'] = 'FinPulse';
      }

      const body = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
      };

      if (isOpenRouter) {
        body.reasoning = { effort: 'none' };
      }

      if (options.jsonMode && !isOpenRouter) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`AI API error ${res.status} [${model}]: ${errText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      if (content) return content;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models failed');
}

export async function generateAISummary(apiKey, data = {}) {
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const income = Number(data.income) || 0;
  const expenses = Number(data.expenses) || 0;
  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  let catText = 'None';
  if (data.categorySpend && typeof data.categorySpend === 'object') {
    catText = Object.entries(data.categorySpend)
      .map(([cat, tot]) => `${cat}: SAR ${Number(tot).toFixed(2)}`)
      .slice(0, 5)
      .join(', ') || 'None';
  } else if (Array.isArray(data.topCategories)) {
    catText = data.topCategories.map(c => `${c.category}: SAR ${Number(c.total).toFixed(2)}`).join(', ') || 'None';
  }

  const prompt = `You are a personal finance AI advisor for a user in Saudi Arabia (currency: SAR).
Current finances:
- Total Balance: SAR ${totalBalance.toFixed(2)} across ${accounts.length} account(s)
- This month's Income: SAR ${income.toFixed(2)}
- This month's Expenses: SAR ${expenses.toFixed(2)}
- Top Spending Categories: ${catText}

Write a direct, friendly 2-sentence summary of their financial health with one actionable tip. Do not use Markdown headers.`;

  return callAi(apiKey, [{ role: 'user', content: prompt }]);
}

export async function processChat(apiKey, arg2, arg3, arg4) {
  let history, userMessage, context;
  if (Array.isArray(arg2)) {
    history = arg2;
    userMessage = arg3;
    context = arg4 || {};
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    history = arg2.history || [];
    userMessage = arg2.userMessage || arg2.message || '';
    context = arg2.context || arg2;
  } else {
    history = [];
    userMessage = String(arg2 || '');
    context = {};
  }

  const accounts = Array.isArray(context.accounts) ? context.accounts : [];
  const systemPrompt = `You are FinPulse AI, a smart personal finance assistant for a user in Saudi Arabia (SAR).
Current data:
- Accounts: ${JSON.stringify(accounts)}
- Monthly Income: SAR ${context.monthlyIncome || 0}
- Monthly Expenses: SAR ${context.monthlyExpenses || 0}
- Today: ${context.today || new Date().toISOString().split('T')[0]}

Guidelines:
1. If the user explicitly wants to add an expense or income, output ONLY a JSON object:
{"action":"transaction","type":"income"|"expense","amount":number,"account_id":number,"category":"category_name","description":"description","date":"YYYY-MM-DD"}
2. If the user wants a transfer:
{"action":"transfer","from_account_id":number,"to_account_id":number,"amount":number,"description":"description"}
3. Otherwise, answer questions and give practical finance tips warmly and concisely.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-8).map(m => ({ role: m.role || 'user', content: m.content || m.message || '' })),
    { role: 'user', content: userMessage }
  ];

  const raw = await callAi(apiKey, messages);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}

  return raw;
}

export async function generateStoryReport(apiKey, data = {}) {
  const month = data.month || data.currentMonth || '';
  const income = Number(data.income ?? data.monthlyData?.income ?? 0);
  const expenses = Number(data.expenses ?? data.monthlyData?.expense ?? 0);
  const prompt = `You are a financial storyteller. Create a 2-sentence narrative report for ${month} in SAR.
- Total Income: SAR ${income.toFixed(2)}
- Total Expenses: SAR ${expenses.toFixed(2)}
Highlight savings and positive financial momentum.`;

  return callAi(apiKey, [{ role: 'user', content: prompt }]);
}

export async function generateBudgetSuggestions(apiKey, data = {}) {
  const spending = data.categorySpend || data.spending || {};
  const currentBudgets = data.budgets || data.currentBudgets || [];
  const prompt = `Based on category spending in SAR: ${JSON.stringify(spending)} and current budgets: ${JSON.stringify(currentBudgets)}, suggest 3-5 budgets. Return ONLY a JSON array: [{"category":"Food","suggested_limit":1200,"reason":"Based on average spending"}]`;

  const text = await callAi(apiKey, [{ role: 'user', content: prompt }], { jsonMode: true });
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : text);
  } catch {
    return [];
  }
}
