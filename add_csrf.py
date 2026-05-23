import os
import glob
import re

template_dir = 'd:/finpulse---smart-financial-core/templates'
files = glob.glob(os.path.join(template_dir, '*.html'))

csrf_input = '\n    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">'

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace `<form...>` with `<form...>\n    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">`
    # But only if it's method="POST" (or we can just add to all forms)
    # Be careful not to add it multiple times.
    
    if 'name="csrf_token"' in content:
        continue
        
    # Regex to match <form ...>
    # We will use re.sub with a function to only replace POST forms, or just all forms.
    def replace_form(match):
        tag = match.group(0)
        # Skip forms that are explicitly method="GET"
        if 'method="GET"' in tag.upper():
            return tag
        return tag + csrf_input

    new_content = re.sub(r'<form[^>]*>', replace_form, content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Added CSRF to {file}")
