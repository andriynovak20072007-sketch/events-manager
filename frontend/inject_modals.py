import glob
import re

# Read index.html to extract the modals
with open('d:/Desktop/VS/frontend/css/index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract authModal
# find <div id="authModal" ... to its matching closing tags. 
# It ends right before <section class="promo-section"> in index.html
auth_modal_start = index_content.find('<div id="authModal"')
promo_start = index_content.find('<section class="promo-section">')
if auth_modal_start != -1 and promo_start != -1:
    auth_modal_html = index_content[auth_modal_start:promo_start].strip()
else:
    auth_modal_html = ""

# Extract userPanel
user_panel_start = index_content.find('<div id="userPanelOverlay"')
user_panel_end = index_content.find('</aside>') + len('</aside>')
if user_panel_start != -1 and user_panel_end != -1:
    user_panel_html = index_content[user_panel_start:user_panel_end].strip()
else:
    user_panel_html = ""

html_files = glob.glob('d:/Desktop/VS/frontend/css/*.html')

for file in html_files:
    if file.endswith('index.html'):
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Check if we need to add authModal
    if 'id="authModal"' not in content and auth_modal_html:
        # Insert before closing body
        content = content.replace('</body>', f'\n{auth_modal_html}\n</body>')
        modified = True
        
    # Check if we need to add userPanel
    if 'id="userPanelOverlay"' not in content and user_panel_html:
        content = content.replace('</body>', f'\n{user_panel_html}\n</body>')
        modified = True
        
    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated modals in {file}')
