const fs = require('fs');

const dir = 'e:/pkrfiles/events-manager/frontend/css/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = dir + file;
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.replace(
        '<a href="#" class="social-link">',
        '<a href="https://www.instagram.com/3ventmanager?igsh=MW10dDlwaGF5MXByYg==" class="social-link" target="_blank" rel="noopener noreferrer">'
    );
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log('Updated', filePath);
    }
});
