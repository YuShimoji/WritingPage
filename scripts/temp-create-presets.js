const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'scripts', 'parse-failures.js'), 'utf8').substring(0, 100);
console.log('Test:', content.substring(0, 50));
