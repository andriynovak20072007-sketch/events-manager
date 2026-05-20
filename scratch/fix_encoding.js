const fs = require('fs');
const iconv = require('iconv-lite');

const filePath = 'e:\\pkrfiles\\events-manager\\frontend\\css\\events.html';

try {
    // Read the file as utf-8 strings (which contains the mojibake)
    const text = fs.readFileSync(filePath, 'utf8');
    
    // Convert the mojibake string back to a buffer using latin1 (which maps 1-to-1)
    // Actually, iconv-lite allows encoding to cp1251
    const buffer = iconv.encode(text, 'cp1251');
    
    // Now decode that buffer as utf8
    const fixedText = buffer.toString('utf8');
    
    fs.writeFileSync(filePath, fixedText, 'utf8');
    console.log("Fixed events.html!");
} catch (e) {
    console.error(e);
}
