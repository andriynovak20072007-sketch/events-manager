const fs = require('fs');

const data = fs.readFileSync('d:/Desktop/VS/frontend/css/map.html', 'utf8');
const svgMatch = data.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
if (!svgMatch) {
    console.error('No SVG found');
    process.exit(1);
}

const svgContent = svgMatch[1];
const pathMatches = svgContent.matchAll(/<path[^>]*d="([^"]+)"/g);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (const match of pathMatches) {
    const d = match[1];
    const coords = d.split(/[MLZHVCSQTA\s,]+/i).filter(s => s.trim() !== '');
    for (let i = 0; i < coords.length; i++) {
        const val = parseFloat(coords[i]);
        if (isNaN(val)) continue;
        if (i % 2 === 0) {
            minX = Math.min(minX, val);
            maxX = Math.max(maxX, val);
        } else {
            minY = Math.min(minY, val);
            maxY = Math.max(maxY, val);
        }
    }
}

console.log(`SVG Bounds: x=[${minX}, ${maxX}], y=[${minY}, ${maxY}]`);

// Also find centers of specific regions
const regionMatches = svgContent.matchAll(/<path id="([^"]+)" class="region" data-name="([^"]+)"\s+d="([^"]+)"/g);
for (const match of regionMatches) {
    const id = match[1];
    const name = match[2];
    const d = match[3];
    const coords = d.split(/[MLZHVCSQTA\s,]+/i).filter(s => s.trim() !== '');
    let rMinX = Infinity, rMaxX = -Infinity;
    let rMinY = Infinity, rMaxY = -Infinity;
    for (let i = 0; i < coords.length; i++) {
        const val = parseFloat(coords[i]);
        if (isNaN(val)) continue;
        if (i % 2 === 0) {
            rMinX = Math.min(rMinX, val);
            rMaxX = Math.max(rMaxX, val);
        } else {
            rMinY = Math.min(rMinY, val);
            rMaxY = Math.max(rMaxY, val);
        }
    }
    const centerX = (rMinX + rMaxX) / 2;
    const centerY = (rMinY + rMaxY) / 2;
    console.log(`Region ${id} (${name}): center=(${centerX.toFixed(2)}, ${centerY.toFixed(2)}), bounds: x=[${rMinX}, ${rMaxX}], y=[${rMinY}, ${rMaxY}]`);
}
