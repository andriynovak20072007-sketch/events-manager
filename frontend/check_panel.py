import glob

html_files = glob.glob('d:/Desktop/VS/frontend/css/*.html')
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'id="userPanel"' not in content:
        print(f'userPanel missing in {file}')
