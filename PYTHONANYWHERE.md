# Deploying FinPulse on PythonAnywhere

Replace `AwaisAI` with your username if different. Works on a free account (SQLite).

## 1. Get the code (Bash console)

```bash
cd ~
git clone -b claude/charming-lamport-7jn1dt https://github.com/Awaisksa1233/FinPulse.git
cd FinPulse
mkvirtualenv finpulse --python=python3.12   # use a Python version your account offers
pip install -r requirements.txt
```

If the repo is private, clone with a GitHub personal access token or upload a zip via the **Files** tab.

## 2. Configure

```bash
cp .env.example .env
nano .env     # set ADMIN_PIN to your own value; optionally GROQ_API_KEY
```

## 3. Create the web app

**Web** tab → *Add a new web app* → *Manual configuration* → same Python version.

- **Virtualenv:** `/home/AwaisAI/.virtualenvs/finpulse`
- **Source / working directory:** `/home/AwaisAI/FinPulse`
- **Static files:** URL `/static/` → `/home/AwaisAI/FinPulse/static`
- Open the **WSGI configuration file** link and replace its contents with:

```python
import sys
path = '/home/AwaisAI/FinPulse'
if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
```

Press **Reload**. Visit `https://AwaisAI.pythonanywhere.com`, sign up, and add your accounts.
Tables are created automatically on first load; data is in `~/FinPulse/instance/finpulse.db`.

## 4. After you sign up

- Set `REGISTRATION_OPEN=false` in `.env` and Reload, so nobody else can register.
- Back up `instance/finpulse.db` (Files tab → download) or use **Reports → Export transactions (CSV)**.

## Updating later

```bash
cd ~/FinPulse && git pull && workon finpulse && pip install -r requirements.txt
```
then press **Reload** on the Web tab. New tables are created automatically on start-up.

## Notes

- Free accounts can only reach allow-listed outside sites, so the AI assistant (Groq) and Telegram bot may not work there.
- Telegram webhooks need an HTTPS URL, which PythonAnywhere provides.
