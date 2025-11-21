const fs = require('fs');

// Fix test/page.jsx by line numbers
let lines = fs.readFileSync('src/app/test/page.jsx', 'utf8').split('\n');

// Find and fix all corrupted console.log lines
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dY\'_')) {
    lines[i] = lines[i].replace(/dY'_/g, '💾');
    lines[i] = lines[i].replace(/console\.log\("💾/g, 'console.log("💾');
    lines[i] = lines[i].replace(/"\);$/g, '");');
  }
}

fs.writeFileSync('src/app/test/page.jsx', lines.join('\n'), 'utf8');
console.log('Fixed test/page.jsx');

// Fix testing_dash/page.jsx
let lines2 = fs.readFileSync('src/app/testing_dash/page.jsx', 'utf8').split('\n');
// Find line with className issue
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].trim().startsWith('className={`px-3')) {
    lines2[i] = '                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${';
    break;
  }
}
fs.writeFileSync('src/app/testing_dash/page.jsx', lines2.join('\n'), 'utf8');
console.log('Fixed testing_dash/page.jsx');
