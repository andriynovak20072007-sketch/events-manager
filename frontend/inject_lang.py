import os
import glob

html_files = glob.glob('d:/Desktop/VS/frontend/css/*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<script src="lang.js"></script>' not in content:
        # Try to insert before <script src="script.js"></script>
        if '<script src="script.js"></script>' in content:
            content = content.replace('<script src="script.js"></script>', '<script src="lang.js"></script>\n  <script src="script.js"></script>')
        else:
            # Otherwise insert before </body>
            content = content.replace('</body>', '  <script src="lang.js"></script>\n</body>')
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Injected lang.js into {file}')
