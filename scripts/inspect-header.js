const fs = require('fs');
const buf = fs.readFileSync('AI_CONTEXT.md');
console.log('Bytes:', buf.subarray(0, 20));
console.log('Hex:', buf.subarray(0, 20).toString('hex'));
console.log('String:', buf.subarray(0, 20).toString('utf8'));
