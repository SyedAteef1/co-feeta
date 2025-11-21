const fs = require('fs');

let lines = fs.readFileSync('src/components/SlackConnectButton.jsx', 'utf8').split('\n');

// Fix line 3
lines[2] = 'import { useState, useEffect } from "react";';

// Fix line 79
lines[78] = '    <span className="text-sm text-green-400">✓ Slack</span>';

fs.writeFileSync('src/components/SlackConnectButton.jsx', lines.join('\n'), 'utf8');
console.log('Fixed SlackConnectButton.jsx');
