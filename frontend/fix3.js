const fs = require('fs');

// Fix test/page.jsx - line 349
let lines = fs.readFileSync('src/app/test/page.jsx', 'utf8').split('\n');
lines[348] = '        console.log("💾 User message saved to database");';
fs.writeFileSync('src/app/test/page.jsx', lines.join('\n'), 'utf8');
console.log('Fixed test/page.jsx line 349');
