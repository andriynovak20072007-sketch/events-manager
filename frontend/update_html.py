import os
import glob

html_files = glob.glob('d:/Desktop/VS/frontend/css/*.html')

new_html = """<div class="language-dropdown-wrapper">
        <div class="language-btn">UA <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i></div>
        <div class="language-dropdown hidden">
          <button type="button" class="lang-option active">UA - Українська</button>
          <button type="button" class="lang-option">EN - English</button>
        </div>
      </div>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<div class="language-btn">UA</div>' in content:
        content = content.replace('<div class="language-btn">UA</div>', new_html)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
