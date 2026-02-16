const fs = require('fs');
const path = 'AI_CONTEXT.md';
const buf = fs.readFileSync(path);
if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    console.log('BOM detected. Removing...');
    const newBuf = buf.subarray(3);
    fs.writeFileSync(path, newBuf);
    console.log('BOM removed.');
} else {
    console.log('No BOM detected.');
}
