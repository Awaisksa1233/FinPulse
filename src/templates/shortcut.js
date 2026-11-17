import { baseLayout, esc } from './base.js';

export function shortcutPage({ user, serverUrl = '', flash = [] }) {
  const content = `
    <header class="page-header" style="margin-bottom:24px;">
      <h2 class="page-title">iOS Shortcut Setup</h2>
      <p class="page-subtitle">Add expenses with natural language using Siri or Shortcuts!</p>
    </header>

    <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);color:white;border:none;box-shadow:0 10px 24px -6px rgba(29,78,216,0.3);">
      <h3 class="card-title" style="color:white;margin-bottom:12px;">🔒 Quick API Integration</h3>
      <p style="margin-bottom:16px;opacity:0.9;font-size:14px;">Use this endpoint to add transactions directly via Siri or iOS Shortcuts.</p>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;opacity:0.8;font-weight:bold;">Your API Endpoint</label>
        <div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:8px;font-family:monospace;word-break:break-all;font-size:13px;border:1px dashed rgba(255,255,255,0.4);" id="apiUrlText">
          ${esc(serverUrl)}/api/ai
        </div>
      </div>
      
      <button class="btn" id="copyTokenBtn" style="background:white;color:#1d4ed8;border:none;font-weight:bold;border-radius:6px;padding:10px 16px;cursor:pointer;font-size:13px;">
        📋 Copy Endpoint URL
      </button>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3 class="card-title" style="margin-bottom:16px;">📱 Step-by-Step Setup Guide</h3>
      <ol style="line-height:2.2;padding-left:24px;font-size:14px;color:var(--gray-700);">
        <li>Open the <strong>Shortcuts</strong> app on your iPhone.</li>
        <li>Tap the <strong>+</strong> icon to create a new shortcut.</li>
        <li>Add the action: <strong>"Ask for Input"</strong> (Type: <code>Text</code>, Prompt: <code>"What did you spend?"</code>).</li>
        <li>Add the action: <strong>"Get Contents of URL"</strong>.</li>
        <li>Set the URL to your Endpoint URL above.</li>
        <li>Change the Method to <strong>POST</strong> and Request Body to <strong>JSON</strong>.</li>
        <li>Add a text field: Key: <code>text</code>, Value: Select <strong>"Provided Input"</strong>.</li>
        <li>Add the action: <strong>"Show Result"</strong> (displays confirmation).</li>
        <li>Name the shortcut <strong>"Add Expense"</strong> and save!</li>
      </ol>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3 class="card-title" style="margin-bottom:12px;">💡 Example Voice Commands</h3>
      <p style="color:var(--gray-600);margin-bottom:12px;font-size:14px;">Trigger by saying "Hey Siri, Add Expense", and speak phrases like:</p>
      <ul style="line-height:2;padding-left:24px;font-size:14px;color:var(--gray-700);">
        <li><code>Paid 50 for lunch</code></li>
        <li><code>Spent 200 on groceries</code></li>
        <li><code>Received 5000 salary</code></li>
        <li><code>Transfer 100 from Wallet to Bank</code></li>
      </ul>
    </div>`;

  return baseLayout({
    title: 'iOS Shortcuts',
    activePage: 'shortcut',
    content,
    user,
    flash,
    scripts: `<script>
      document.getElementById('copyTokenBtn')?.addEventListener('click', () => {
        const textToCopy = document.getElementById('apiUrlText').innerText.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
          const btn = document.getElementById('copyTokenBtn');
          btn.innerHTML = '✅ URL Copied!';
          setTimeout(() => { btn.innerHTML = '📋 Copy Endpoint URL'; }, 2500);
        });
      });
    </script>`
  });
}
