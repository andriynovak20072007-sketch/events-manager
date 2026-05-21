import glob, os

files = glob.glob(r'e:\pkrfiles\events-manager\frontend\css\*.html')
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace(
        '<a href="#" class="social-link">',
        '<a href="https://www.instagram.com/3ventmanager?igsh=MW10dDlwaGF5MXByYg==" class="social-link" target="_blank" rel="noopener noreferrer">'
    )
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
