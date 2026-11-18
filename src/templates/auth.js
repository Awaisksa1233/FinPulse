// src/templates/auth.js

export function authPage({ mode = 'login', flash = [] }) {
  const isLogin = mode === 'login';
  const title = isLogin ? 'Login' : 'Register';

  const flashHtml = flash.map(f => `
    <div class="mb-4 p-3 rounded-2xl text-xs font-semibold ${f.type === 'error' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}">
      ${f.message}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${title} – FinPulse</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 antialiased select-none">
  <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
    <div class="flex items-center gap-2 mb-6">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center font-black text-sm text-white">FP</div>
      <div>
        <h1 class="text-base font-bold text-white">FinPulse</h1>
        <p class="text-[11px] text-slate-400">Personal Financial System (SAR)</p>
      </div>
    </div>

    ${flashHtml}

    <h2 class="text-lg font-extrabold text-white mb-1">${title}</h2>
    <p class="text-xs text-slate-400 mb-5">${isLogin ? 'Sign in to access your financial dashboard' : 'Create an account to start tracking in SAR'}</p>

    <form method="POST" action="/${mode}" class="space-y-3.5">
      ${!isLogin ? `
      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
        <input type="text" name="full_name" required placeholder="Awais Khan" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
      </div>
      ` : ''}

      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
        <input type="email" name="email" required placeholder="name@example.com" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
      </div>

      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
        <input type="password" name="password" required placeholder="••••••••" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
      </div>

      ${isLogin ? `
      <div class="flex items-center justify-between text-[11px] text-slate-400">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" name="remember" checked class="rounded bg-slate-800 border-slate-700">
          Remember me
        </label>
      </div>
      ` : ''}

      <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-98">
        ${isLogin ? 'Sign In' : 'Create Account'}
      </button>
    </form>

    <div class="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
      ${isLogin ? `Don't have an account? <a href="/register" class="text-blue-400 font-semibold hover:underline">Register</a>` : `Already have an account? <a href="/login" class="text-blue-400 font-semibold hover:underline">Login</a>`}
    </div>
  </div>
</body>
</html>`;
}
