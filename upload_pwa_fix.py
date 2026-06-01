import os
import subprocess

token = "59b8b0239d819eabb2360301669f9bc0e70f97b7"
username = "AwaisAI"
domain = "AwaisAI.pythonanywhere.com"
base_dir = r"d:\finpulse---smart-financial-core"

# Files to upload: (local relative path, remote absolute path)
files_to_upload = [
    ("static/style.css", f"/home/{username}/mysite/static/style.css"),
    ("static/sw.js", f"/home/{username}/mysite/static/sw.js"),
    ("templates/base.html", f"/home/{username}/mysite/templates/base.html"),
    ("templates/accounts.html", f"/home/{username}/mysite/templates/accounts.html"),
    ("templates/loans.html", f"/home/{username}/mysite/templates/loans.html"),
    ("templates/budgets.html", f"/home/{username}/mysite/templates/budgets.html"),
    ("templates/recurring.html", f"/home/{username}/mysite/templates/recurring.html"),
    ("templates/transactions.html", f"/home/{username}/mysite/templates/transactions.html"),
    ("services/telegram_service.py", f"/home/{username}/mysite/services/telegram_service.py"),
]

success_count = 0
for local_rel, remote_path in files_to_upload:
    local_path = os.path.join(base_dir, local_rel)
    url = f"https://www.pythonanywhere.com/api/v0/user/{username}/files/path{remote_path}"

    print(f"Uploading {local_rel}...")
    cmd = [
        "curl.exe", "-s", "-X", "POST", url,
        "-H", f"Authorization: Token {token}",
        "-F", f"content=@{local_path}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    output = result.stdout.strip()
    if result.returncode == 0 and '"error"' not in output.lower():
        print(f"  OK - {output[:60] if output else 'uploaded'}")
        success_count += 1
    else:
        print(f"  FAILED: {output[:120]} {result.stderr[:50]}")

print(f"\nUploaded {success_count}/{len(files_to_upload)} files")

if success_count > 0:
    print("\nReloading webapp...")
    reload_url = f"https://www.pythonanywhere.com/api/v0/user/{username}/webapps/{domain}/reload/"
    cmd = ["curl.exe", "-s", "-X", "POST", reload_url, "-H", f"Authorization: Token {token}"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    print("Reload result:", result.stdout)

print("Done!")
