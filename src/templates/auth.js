import { esc } from './base.js';

export function authPage({ mode = 'login', flash = [] }) {
  const isLogin = mode === 'login';
  const flashHtml = flash.map(f => `<div class="flash ${f.category || f.type || 'error'}" style="margin-bottom:16px;padding:10px 14px;border-radius:12px;background:${f.category === 'success' || f.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};border:1px solid ${f.category === 'success' || f.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'};color:${f.category === 'success' || f.type === 'success' ? '#34d399' : '#f87171'};font-size:13px;font-weight:600;">${esc(f.message)}</div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${isLogin ? 'Login' : 'Register'} - FinPulse</title>
  <link rel="manifest" href="/static/manifest.json">
  <meta name="theme-color" content="#090d16">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      display: flex; justify-content: center; align-items: center; min-height: 100vh;
      background: #090d16; color: #f8fafc; padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .auth-container {
      background: #111827; border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 36px 28px; border-radius: 28px; box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      width: 100%; max-width: 400px;
    }
    .auth-logo {
      width: 54px; height: 54px; background: linear-gradient(135deg, #1d4ed8, #0d9488);
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 24px; margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
    }
    .auth-title { text-align: center; font-size: 22px; font-weight: 800; color: #f8fafc; margin-bottom: 6px; letter-spacing: -0.3px; }
    .auth-subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 22px; }
    
    .auth-tabs { display: flex; background: #0b0f19; border-radius: 14px; padding: 4px; margin-bottom: 20px; gap: 4px; border: 1px solid rgba(255,255,255,0.06); }
    .auth-tab { flex: 1; padding: 9px 12px; text-align: center; font-size: 12px; font-weight: 600; border-radius: 10px; border: none; background: transparent; color: #94a3b8; cursor: pointer; transition: all .15s; }
    .auth-tab.active { background: #1e293b; color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
    
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    
    .telegram-box { background: rgba(0, 136, 204, 0.08); border: 1px solid rgba(0, 136, 204, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 16px; text-align: center; }
    .telegram-icon { width: 44px; height: 44px; background: #0088cc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 4px 12px rgba(0,136,204,0.3); }
    .telegram-title { font-weight: 700; color: #38bdf8; font-size: 14px; margin-bottom: 4px; }
    .telegram-desc { font-size: 12px; color: #94a3b8; margin-bottom: 16px; line-height: 1.4; }
    
    .form-group { margin-bottom: 16px; text-align: left; }
    .form-label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    .form-control {
      width: 100%; padding: 12px 14px; background: #0b0f19; border: 1px solid #1e293b;
      border-radius: 14px; font-size: 13.5px; color: #f8fafc; outline: none; transition: border-color .15s;
    }
    .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
    
    .btn {
      display: inline-flex; align-items: center; justify-content: center; width: 100%;
      padding: 13px 16px; border-radius: 14px; font-size: 13.5px; font-weight: 700;
      border: none; cursor: pointer; transition: transform .12s, box-shadow .15s;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: linear-gradient(135deg, #2563eb, #0d9488); color: white; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35); }
    .btn-telegram { background: #0088cc; color: white; box-shadow: 0 4px 16px rgba(0, 136, 204, 0.35); }
    
    .auth-toggle { text-align: center; margin-top: 20px; font-size: 12.5px; color: #94a3b8; }
    .auth-toggle a { color: #60a5fa; font-weight: 600; text-decoration: none; }
    .auth-toggle a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-logo">F</div>
    <h1 class="auth-title">${isLogin ? 'Welcome to FinPulse' : 'Create an Account'}</h1>
    <p class="auth-subtitle">${isLogin ? 'Sign in to access your dashboard' : 'Start managing your personal finances'}</p>
    ${flashHtml}

    ${isLogin ? `
    <div class="auth-tabs">
      <button type="button" class="auth-tab active" onclick="switchAuthTab('email')">✉️ Email & Password</button>
      <button type="button" class="auth-tab" onclick="switchAuthTab('telegram')">✈️ Telegram</button>
    </div>

    <!-- Email Tab (Default) -->
    <div class="tab-content active" id="tab-email">
      <form action="/login" method="POST">
        <div class="form-group">
          <label class="form-label">Email address</label>
          <input type="email" name="email" class="form-control" placeholder="you@example.com" value="awaisibrahim6@gmail.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
          <input type="checkbox" name="remember" id="remember" checked style="accent-color:#2563eb;width:16px;height:16px;cursor:pointer;">
          <label for="remember" style="font-size:12px;color:#94a3b8;cursor:pointer;user-select:none;">Remember me for 30 days</label>
        </div>
        <button type="submit" class="btn btn-primary">Sign In</button>
      </form>
    </div>

    <!-- Telegram Tab -->
    <div class="tab-content" id="tab-telegram">
      <div class="telegram-box">
        <div class="telegram-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
        </div>
        <div class="telegram-title">Sign in with Telegram</div>
        <p class="telegram-desc">Send <strong>/login</strong> to the Telegram bot to get your one-time code.</p>
        <form action="/login/telegram" method="POST">
          <div class="form-group" style="margin-bottom:12px;">
            <input type="text" name="code" class="form-control" placeholder="ENTER CODE"
              style="text-transform:uppercase;letter-spacing:3px;font-family:monospace;text-align:center;font-size:18px;padding:12px;" maxlength="8" required>
          </div>
          <button type="submit" class="btn btn-telegram">Sign In with Telegram</button>
        </form>
      </div>
    </div>
    ` : `
    <!-- Registration Form -->
    <form action="/register" method="POST">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" name="full_name" class="form-control" placeholder="Your name" required autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" name="email" class="form-control" placeholder="you@example.com" required autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" placeholder="Minimum 8 characters" minlength="8" required autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:8px;">Create Account</button>
    </form>
    `}

    <p class="auth-toggle">
      ${isLogin ? `Don't have an account? <a href="/register">Sign up</a>` : `Already have an account? <a href="/login">Sign in</a>`}
    </p>
  </div>

  <script>
    function switchAuthTab(tab) {
      document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'email' && i === 0) || (tab === 'telegram' && i === 1));
      });
      document.getElementById('tab-email').classList.toggle('active', tab === 'email');
      document.getElementById('tab-telegram').classList.toggle('active', tab === 'telegram');
    }
  </script>
</body>
</html>`;
}
