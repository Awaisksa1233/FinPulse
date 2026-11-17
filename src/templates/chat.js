import { baseLayout, esc } from './base.js';

export function chatPage({ user, messages, flash }) {
  const msgHtml = messages.map(m => {
    const isUser = m.role === 'user';
    return `
    <div style="display:flex;${isUser ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}margin-bottom:16px;">
      ${!isUser ? `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </div>` : ''}
      <div style="max-width:75%;background:${isUser ? 'var(--primary)' : 'var(--gray-100)'};color:${isUser ? 'white' : 'var(--gray-800)'};padding:12px 16px;border-radius:${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};font-size:14px;line-height:1.5;white-space:pre-wrap;">
        ${esc(m.content)}
      </div>
      ${isUser ? `<div style="width:32px;height:32px;border-radius:50%;background:var(--gray-200);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:10px;font-weight:600;font-size:13px;color:var(--gray-600);">
        ${esc((user.full_name || user.email || 'U').charAt(0).toUpperCase())}
      </div>` : ''}
    </div>`;
  }).join('');

  const content = `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 160px);">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0;">
        <div>
          <h2 class="page-title" style="margin:0;">AI Assistant</h2>
          <p class="page-subtitle" style="margin:0;">Ask anything about your finances or add transactions by voice.</p>
        </div>
        <form method="POST" action="/chat/clear" onsubmit="return confirm('Clear chat history?')">
          <button type="submit" class="btn btn-ghost" style="font-size:13px;">Clear</button>
        </form>
      </header>

      <!-- Messages -->
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:4px 0 16px;">
        ${messages.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;color:var(--gray-400);">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <p style="font-weight:600;font-size:16px;color:var(--gray-700);margin:0 0 8px;">FinPulse AI</p>
          <p style="margin:0 0 20px;">Ask me about your spending, or add transactions using natural language.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            ${['How much did I spend this month?','Add expense 150 SAR food today','What\'s my biggest spending category?','Transfer 500 from cash to Al Rajhi'].map(s =>
              `<button onclick="document.getElementById('chatInput').value=this.textContent;document.getElementById('chatInput').focus()" style="background:white;border:1px solid var(--gray-200);border-radius:999px;padding:8px 16px;font-size:13px;cursor:pointer;color:var(--gray-700);">${esc(s)}</button>`
            ).join('')}
          </div>
        </div>` : msgHtml}
      </div>

      <!-- Input -->
      <div style="flex-shrink:0;background:white;border-top:1px solid var(--gray-100);padding-top:12px;">
        <form id="chatForm" method="POST" action="/chat" style="display:flex;gap:8px;">
          <input id="chatInput" name="message" type="text" required
            class="form-control"
            placeholder="Ask anything or say 'add 200 SAR food'…"
            autocomplete="off"
            style="flex:1;">
          <button type="submit" id="chatSend" class="btn btn-primary" style="flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <p style="font-size:11px;color:var(--gray-400);text-align:center;margin:8px 0 0;">AI can make mistakes. Review transactions before relying on them.</p>
      </div>
    </div>

    <script>
    // Scroll to bottom
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    // Show typing indicator on submit
    document.getElementById('chatForm').addEventListener('submit', function() {
      const btn = document.getElementById('chatSend');
      btn.disabled = true;
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    });
    </script>`;

  return baseLayout({ title: 'AI Chat', activePage: 'chat', content, user, flash });
}
