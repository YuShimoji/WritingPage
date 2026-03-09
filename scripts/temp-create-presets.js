const fs = require('fs');
const path = require('path');
const targetPath = path.join(__dirname, 'js', 'modules', 'graphic-novel', 'gn-presets.js');
const content = fs.readFileSync(path.join(__dirname, 'scripts', 'parse-failures.js'), 'utf8').substring(0, 100);
console.log('Test:', content.substring(0, 50));
