import { baseLayout, esc } from './base.js';

function formatMessage(text) {
  if (!text) return '';
  let formatted = esc(text);
  // Bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,.08);color:#38bdf8;padding:2px 6px;border-radius:4px;font-size:12.5px;">$1</code>');
  // Line breaks
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
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <div style="width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#2563eb,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;">F</div>
        <span style="font-size:12px;font-weight:700;color:#94a3b8;">FinPulse AI</span>
      </div>` : ''}
      <div class="chat-text">${formatMessage(m.content)}</div>
    </div>`;
  }).join('');

  const content = `
    <header class="page-header" style="margin-bottom:16px;">
      <div>
        <h2 class="page-title">AI Financial Assistant</h2>
        <p class="page-subtitle">Chat in plain English or Arabic to log expenses, check balances, or get advice.</p>
      </div>
      <form method="POST" action="/chat/clear" onsubmit="return confirm('Clear all chat messages?')">
        <button type="submit" class="btn btn-outline btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Clear History
        </button>
      </form>
    </header>

    <div class="content-wrapper" style="padding-top:0;">
      <div class="chat-container">
        <!-- Chat Header -->
        <div class="chat-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#60a5fa,#34d399);display:flex;align-items:center;justify-content:center;color:#0d1117;font-weight:800;font-size:15px;">F</div>
            <div>
              <div class="chat-header-title">FinPulse Copilot</div>
              <div style="font-size:11px;color:#79b8ff;display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#34d399;display:inline-block;"></span>
                Online & Ready
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" id="chatMessages">
          ${messages.length === 0 ? `
          <div style="text-align:center;padding:48px 20px;margin:auto 0;color:var(--text-muted);">
            <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#2563eb,#0d9488);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;box-shadow:0 8px 24px rgba(37,99,235,.35);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:6px;">How can I help you today?</h3>
            <p style="font-size:13.5px;max-width:440px;margin:0 auto 20px;line-height:1.6;">
              I can log transactions, answer budget questions, analyze spending habits, or project savings.
            </p>
          </div>` : msgHtml}
        </div>

        <!-- Quick suggestions -->
        <div class="chat-suggestions">
          ${suggestions.map(s => `
            <button type="button" class="chat-suggestion-chip" onclick="applySuggestion('${esc(s)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
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
            class="chat-input"
            placeholder="Type a message or instruction (e.g. 'Paid 45 SAR for coffee')…"
            autocomplete="off"
          >
          <button type="submit" id="chatSend" class="chat-send-btn" title="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>`;

  const scripts = `
  <script>
    function applySuggestion(text) {
      const input = document.getElementById('chatInput');
      input.value = text;
      input.focus();
    }

    // Scroll to bottom
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    // Loading spinner on submit
    document.getElementById('chatForm').addEventListener('submit', function() {
      const btn = document.getElementById('chatSend');
      btn.disabled = true;
      btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;"></div>';
    });
  </script>`;

  return baseLayout({
    title: 'AI Assistant',
    activePage: 'chat',
    content,
    scripts,
    user,
    flash
  });
}
