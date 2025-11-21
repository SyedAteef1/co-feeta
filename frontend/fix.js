const fs = require('fs');

// Fix test/page.jsx
let content = fs.readFileSync('src/app/test/page.jsx', 'utf8');
content = content.replace(/alert\(`Please select a project and connect a repository first"\);/, 'alert("Please select a project and connect a repository first");');
content = content.replace(/setInput\(""\`\);/, 'setInput("");');
fs.writeFileSync('src/app/test/page.jsx', content, 'utf8');
console.log('Fixed test/page.jsx');

// Fix testing_dash/page.jsx  
let content2 = fs.readFileSync('src/app/testing_dash/page.jsx', 'utf8');
content2 = content2.replace(/className=\{`px-3 py-1\.5 rounded-lg text-sm font-medium transition-colors \$\{/g, 'className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${');
fs.writeFileSync('src/app/testing_dash/page.jsx', content2, 'utf8');
console.log('Fixed testing_dash/page.jsx');

console.log('All fixes applied!');
