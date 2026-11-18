// src/templates/chat.js
import { baseLayout } from './base.js';

export function chatPage({ user, messages = [], flash = [] }) {
  const content = `
    <div class="space-y-3 flex flex-col h-full">
      <div class="flex items-center justify-between pt-1 border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow">
            ⚡
          </div>
          <div>
            <h2 class="text-xs font-bold text-slate-100">FinPulse AI</h2>
            <p class="text-[9px] text-emerald-400">Powered by LLaMA 3.3 (SAR)</p>
          </div>
        </div>
        <form method="POST" action="/chat/clear">
          <button type="submit" class="text-[10px] text-slate-400 hover:text-slate-200">Reset</button>
        </form>
      </div>

      <!-- Messages Stream -->
      <div class="space-y-2.5 text-xs flex-1 overflow-y-auto max-h-[380px] no-scrollbar">
        ${messages.length > 0 ? messages.map(m => `
          <div class="flex items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2">
            ${m.role !== 'user' ? `<div class="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">🤖</div>` : ''}
            <div class="${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm ml-auto' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'} p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm">
              ${m.content}
            </div>
          </div>
        `).join('') : `
          <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-slate-300 space-y-1">
            <p class="font-bold text-blue-400 text-xs">Salam Awais!</p>
            <p>I am your FinPulse financial assistant. Ask me anything about your SAR spending, KSA salary rollover, or upcoming budgets.</p>
          </div>
        `}
      </div>

      <!-- Chat Input -->
      <form method="POST" action="/chat" class="relative pt-1">
        <input type="text" name="message" required placeholder="Ask AI advisor or type expense..." class="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-3.5 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm">
        <button type="submit" class="absolute right-2 top-2.5 p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </form>
    </div>
  `;

  return baseLayout({
    title: 'AI Advisor',
    activePage: 'chat',
    content,
    user,
    flash
  });
}
