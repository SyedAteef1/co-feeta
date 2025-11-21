const fs = require('fs');

// Fix test/page.jsx - line 327
let lines = fs.readFileSync('src/app/test/page.jsx', 'utf8').split('\n');
lines[326] = '    setInput("");';
fs.writeFileSync('src/app/test/page.jsx', lines.join('\n'), 'utf8');
console.log('Fixed test/page.jsx line 327');

// Fix testing_dash/page.jsx - line 614
let lines2 = fs.readFileSync('src/app/testing_dash/page.jsx', 'utf8').split('\n');
lines2[613] = '                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${';
fs.writeFileSync('src/app/testing_dash/page.jsx', lines2.join('\n'), 'utf8');
console.log('Fixed testing_dash/page.jsx line 614');
