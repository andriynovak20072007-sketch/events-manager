import os

file_path = r'e:\pkrfiles\events-manager\frontend\css\events.html'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Encode the text to cp1251 (ignoring characters that don't fit, just in case)
try:
    bytes_data = text.encode('cp1251')
    # Decode back as utf-8
    fixed_text = bytes_data.decode('utf-8')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print("Fixed events.html")
except Exception as e:
    print("Error:", e)
