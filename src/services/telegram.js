// Telegram Bot API service

export function tgApi(botToken) {
  const base = `https://api.telegram.org/bot${botToken}`;
  return {
    async sendMessage(chatId, text, opts = {}) {
      return fetch(`${base}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...opts }),
      });
    },
  };
}

export function formatTelegramMessage(type, data) {
  if (type === 'welcome') {
    return `👋 <b>Welcome to FinPulse!</b>\n\nYour login code is: <code>${data.code}</code>\n\nEnter this on the FinPulse login page to sign in.\n\n<i>Code expires in 10 minutes.</i>`;
  }
  if (type === 'daily_summary') {
    const { name, income, expenses, balance } = data;
    return `📊 <b>Daily Summary for ${name}</b>\n\n💰 Income: SAR ${income.toFixed(2)}\n💸 Expenses: SAR ${expenses.toFixed(2)}\n🏦 Net: SAR ${(income - expenses).toFixed(2)}\n\n<i>Total balance: SAR ${balance.toFixed(2)}</i>`;
  }
  return '';
}
