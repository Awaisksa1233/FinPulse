// FinPulse — AI Financial Advisor Chat
// Rebuilt clean from scratch matching the fintech prototype

import { baseLayout, esc } from './base.js';

function formatMessage(text) {
  if (!text) return '';
  let formatted = esc(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);color:#38bdf8;padding:2px 6px;border-radius:4px;font-size:12px;font-family:ui-monospace,monospace;">$1</code>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

export function chatPage({ user, messages = [], flash = [] }) {
  const suggestions = [
    'How much did I spend this month?',
    'Add expense 150 SAR groceries',
    'What is my top spending category?',
    'Add income 5000 SAR salary',
    'Transfer 500 from cash to Al Rajhi',
    'How am I doing on my budgets?'
  ];

  const msgHtml = messages.map(m => {
    const isUser = m.role === 'user';
    return `
    <div class="chat-message ${isUser ? 'user' : 'assistant'}">
      ${!isUser ? `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #2563eb, #0d9488); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 11px;">F</div>
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">FinPulse AI</span>
      </div>` : ''}
      <div>${formatMessage(m.content)}</div>
    </div>`;
  }).join('');

  const content = `
    <div class="page-header" style="margin-bottom: 12px;">
      <div>
        <h2 class="page-title">AI Advisor</h2>
        <p class="page-subtitle">Your personal fintech copilot</p>
      </div>
      <form method="POST" action="/chat/clear" onsubmit="return confirm('Clear chat history?')">
        <button type="submit" class="btn btn-outline btn-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Clear
        </button>
      </form>
    </div>

    <div class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="flex items-center gap-2">
          <div style="width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, #60a5fa, #34d399); display: flex; align-items: center; justify-content: center; color: #090d16; font-weight: 800; font-size: 15px;">F</div>
          <div>
            <div class="chat-header-title">FinPulse Copilot</div>
            <div style="font-size: 10.5px; color: #34d399; display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
              Online & Ready
            </div>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" id="chatMessages">
        ${messages.length === 0 ? `
        <div style="text-align: center; padding: 40px 16px; margin: auto 0; color: var(--text-muted);">
          <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #2563eb, #0d9488); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: white; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">How can I assist your finances?</h3>
          <p style="font-size: 12.5px; max-width: 320px; margin: 0 auto; line-height: 1.5; color: var(--text-muted);">
            Log expenses, query account balances, analyze spending cycles, or forecast savings in English or Arabic.
          </p>
        </div>` : msgHtml}
      </div>

      <!-- Quick Suggestions -->
      <div class="chat-suggestions">
        ${suggestions.map(s => `
          <button type="button" class="chat-suggestion-chip" onclick="applySuggestion('${esc(s)}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            ${esc(s)}
          </button>
        `).join('')}
      </div>

      <!-- Input Form -->
      <form class="chat-input-form" id="chatForm" method="POST" action="/chat">
        <input
          id="chatInput"
          name="message"
          type="text"
          required
          autocomplete="off"
          class="chat-input"
          placeholder="Ask or command (e.g. 'Paid 45 SAR for coffee')..."
        />
        <button type="submit" class="chat-send-btn" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>

    <script>
      function applySuggestion(text) {
        const input = document.getElementById('chatInput');
        input.value = text;
        input.focus();
      }
      // Auto-scroll chat to bottom
      const msgBox = document.getElementById('chatMessages');
      if (msgBox) {
        msgBox.scrollTop = msgBox.scrollHeight;
      }
    </script>
  `;

  return baseLayout({
    title: 'AI Advisor',
    activePage: 'chat',
    content,
    user,
    flash
  });
}
