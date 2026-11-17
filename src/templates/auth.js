import { esc } from './base.js';

export function authPage({ mode = 'login', flash = [] }) {
  const isLogin = mode === 'login';
  const flashHtml = flash.map(f => `<div class="flash ${f.category || 'error'}" style="margin-bottom:16px;padding:10px 14px;border-radius:8px;background:${f.category === 'success' ? '#16a34a' : '#dc2626'};color:white;">${esc(f.message)}</div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isLogin ? 'Login' : 'Register'} - FinPulse</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="manifest" href="/static/manifest.json">
  <style>
    body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#1e3a8a 100%);padding:16px;}
    .auth-container{background:white;padding:36px 32px;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.35);width:100%;max-width:400px;}
    .auth-logo{width:52px;height:52px;background:linear-gradient(135deg,#1d4ed8,#0d9488);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:22px;margin:0 auto 22px;}
    .auth-title{text-align:center;font-size:24px;font-weight:600;color:var(--gray-800);margin-bottom:8px;}
    .auth-subtitle{text-align:center;color:var(--gray-500);margin-bottom:24px;}
    .telegram-box{background:linear-gradient(135deg,#0088cc15,#0088cc08);border:2px solid #0088cc30;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;}
    .telegram-icon{width:48px;height:48px;background:#0088cc;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}
    .telegram-title{font-weight:600;color:#0088cc;margin-bottom:8px;}
    .telegram-desc{font-size:13px;color:var(--gray-600);margin-bottom:16px;}
    .divider{text-align:center;margin:24px 0;position:relative;}
    .divider span{background:white;padding:0 12px;color:var(--gray-400);font-size:13px;position:relative;z-index:1;}
    .divider::before{content:'';position:absolute;top:50%;left:0;right:0;height:1px;background:var(--gray-200);}
    .auth-toggle{text-align:center;margin-top:24px;color:var(--gray-600);}
    .auth-toggle a{color:var(--primary);font-weight:500;}
    .email-form{display:none;}
    .email-form.show{display:block;}
    .btn-telegram{background:#0088cc;color:white;border:none;}
    .btn-telegram:hover{background:#006699;}
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-logo">F</div>
    <h1 class="auth-title">${isLogin ? 'Welcome to FinPulse' : 'Get Started'}</h1>
    <p class="auth-subtitle">${isLogin ? 'Sign in with Telegram' : 'Create your account'}</p>
    ${flashHtml}

    <!-- Telegram Login -->
    <div class="telegram-box">
      <div class="telegram-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
      </div>
      <div class="telegram-title">${isLogin ? 'Login with Telegram' : 'Sign up with Telegram'}</div>
      <p class="telegram-desc">${isLogin ? 'Send <strong>/start</strong> or <strong>/login</strong> to the bot to get a code' : 'Send <strong>/start</strong> to the bot — your account will be created automatically!'}</p>
      <form action="/login/telegram" method="POST">
        <div class="form-group" style="margin-bottom:12px;">
          <input type="text" name="code" class="form-control" placeholder="Enter your code"
            style="text-transform:uppercase;letter-spacing:3px;font-family:monospace;text-align:center;font-size:18px;padding:14px;" maxlength="8" required>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;">
          <input type="checkbox" name="remember" id="tg_remember" checked style="accent-color:#0088cc;">
          <label for="tg_remember" style="font-size:13px;color:var(--gray-600);cursor:pointer;">Remember me</label>
        </div>
        <button type="submit" class="btn btn-telegram btn-block">${isLogin ? 'Sign In' : 'Create Account'}</button>
      </form>
    </div>

    <!-- Email toggle -->
    <div style="text-align:center;">
      <button type="button" onclick="document.getElementById('emailForm').classList.toggle('show')" style="background:none;border:none;color:var(--gray-500);font-size:13px;cursor:pointer;text-decoration:underline;">
        ${isLogin ? 'Use email & password instead' : 'Register with email instead'}
      </button>
    </div>

    <!-- Email Form -->
    <div class="email-form" id="emailForm">
      <div class="divider"><span>Email Login</span></div>
      <form method="POST">
        ${!isLogin ? `<div class="form-group"><label class="form-label">Name</label><input type="text" name="name" class="form-control" placeholder="Your name" required></div>` : ''}
        <div class="form-group"><label class="form-label">Email</label><input type="email" name="email" class="form-control" placeholder="you@example.com" required></div>
        <div class="form-group"><label class="form-label">Password</label><input type="password" name="password" class="form-control" placeholder="••••••••" minlength="6" required></div>
        ${isLogin ? `<div class="form-group" style="display:flex;align-items:center;gap:8px;"><input type="checkbox" name="remember" id="remember" checked style="accent-color:var(--primary);"><label for="remember" style="font-size:14px;color:var(--gray-600);cursor:pointer;">Remember me</label></div>` : ''}
        <button type="submit" class="btn btn-primary btn-block">${isLogin ? 'Sign In' : 'Create Account'}</button>
      </form>
    </div>

    <p class="auth-toggle">
      ${isLogin ? `Don't have an account? <a href="/register">Sign up</a>` : `Already have an account? <a href="/login">Sign in</a>`}
    </p>
  </div>
</body>
</html>`;
}
