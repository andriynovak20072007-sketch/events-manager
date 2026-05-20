import os
import glob

path = r'c:\Users\Анна\OneDrive\Desktop\PKR\frontend\css'
index_path = os.path.join(path, 'index.html')

with open(index_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

def get_block(html, start_tag, end_tag):
    start_idx = html.find(start_tag)
    if start_idx == -1: return None
    end_idx = html.find(end_tag, start_idx) + len(end_tag)
    return html[start_idx:end_idx]

aside_block = get_block(index_html, '<aside id="userPanel" class="user-panel">', '</aside>')

html_files = glob.glob(os.path.join(path, '*.html'))
for file_path in html_files:
    if os.path.basename(file_path) == 'index.html': continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_aside = get_block(content, '<aside id="userPanel"', '</aside>')
    if old_aside:
        target_href = f'href="{os.path.basename(file_path)}"'
        custom_aside = aside_block.replace(f'{target_href} class="panel-link"', f'{target_href} class="panel-link active"')
        content = content.replace(old_aside, custom_aside)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated aside in {os.path.basename(file_path)}')
