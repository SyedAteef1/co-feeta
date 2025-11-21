const fs = require('fs');

// Read test/page.jsx
let content = fs.readFileSync('src/app/test/page.jsx', 'utf8');

// Fix all corrupted lines
content = content.replace(/console\.log\(`dY'_ User message saved to database"\);/g, 'console.log("💾 User message saved to database");');
content = content.replace(/console\.log\(`dY'_ AI response saved to database"\);/g, 'console.log("💾 AI response saved to database");');
content = content.replace(/console\.log\(`dY'_ Plan saved to database"\);/g, 'console.log("💾 Plan saved to database");');
content = content.replace(/console\.log\(`📝 Submitting answers for message:", message\);/g, 'console.log("📝 Submitting answers for message:", message);');
content = content.replace(/console\.log\(`📡 Sending to \/api\/generate_plan:", requestBody\);/g, 'console.log("📡 Sending to /api/generate_plan:", requestBody);');
content = content.replace(/console\.log\(`✅ Response status:", planRes\.status\);/g, 'console.log("✅ Response status:", planRes.status);');
content = content.replace(/console\.log\("📦 Plan data received:`, planData\);/g, 'console.log("📦 Plan data received:", planData);');
content = content.replace(/console\.log\(`✨ Adding AI response to messages:/g, 'console.log("✨ Adding AI response to messages:');
content = content.replace(/console\.error\("❌ Error from API:`, planData\.error\);/g, 'console.error("❌ Error from API:", planData.error);');
content = content.replace(/console\.error\(`❌ Error submitting answers:/g, 'console.error("❌ Error submitting answers:');
content = content.replace(/console\.error\(`Error fetching summary:/g, 'console.error("Error fetching summary:');
content = content.replace(/console\.error\(`Error sending to Slack:/g, 'console.error("Error sending to Slack:');
content = content.replace(/overall_status: `No recent messages in this channel",/g, 'overall_status: "No recent messages in this channel",');
content = content.replace(/sentiment: "neutral`/g, 'sentiment: "neutral"');
content = content.replace(/const originalPrompt = conversationHistory\[conversationHistory\.length - 1\]\?\.prompt \|\| "Task`;/g, 'const originalPrompt = conversationHistory[conversationHistory.length - 1]?.prompt || "Task";');
content = content.replace(/await fetch\(`\$\{API_BASE_URL\}\/slack\/api\/send_message", \{/g, 'await fetch(`${API_BASE_URL}/slack/api/send_message`, {');
content = content.replace(/"Authorization`:/g, '"Authorization":');
content = content.replace(/data\.status === `ambiguous"\)/g, 'data.status === "ambiguous")');
content = content.replace(/aiResponse\.content = `I've analyzed your request: `\$\{input\}`/g, 'aiResponse.content = `I\'ve analyzed your request: "${input}"');
content = content.replace(/className=`/g, 'className="');
content = content.replace(/className=`truncate font-medium">/g, 'className="truncate font-medium">');
content = content.replace(/className="flex gap-4`>/g, 'className="flex gap-4">');
content = content.replace(/className=`text-sm font-bold">/g, 'className="text-sm font-bold">');
content = content.replace(/className=`max-w-3xl mx-auto">/g, 'className="max-w-3xl mx-auto">');
content = content.replace(/className=`w-full bg-\[#111111\]/g, 'className="w-full bg-[#111111]');
content = content.replace(/className=`mt-6 p-4/g, 'className="mt-6 p-4');
content = content.replace(/className="mt-2 text-xs`>/g, 'className="mt-2 text-xs">');
content = content.replace(/className=`p-3 bg-\[#40414F\]/g, 'className="p-3 bg-[#40414F]');
content = content.replace(/placeholder="Your answer\.\.\.`/g, 'placeholder="Your answer..."');
content = content.replace(/\{sendingAll \? "Sending\.\.\.` : `/g, '{sendingAll ? "Sending..." : `');
content = content.replace(/width=`16"/g, 'width="16"');
content = content.replace(/strokeWidth="1\.5`\/>/g, 'strokeWidth="1.5"/>');

fs.writeFileSync('src/app/test/page.jsx', content, 'utf8');
console.log('Fixed test/page.jsx');

// Read testing_dash/page.jsx
let content2 = fs.readFileSync('src/app/testing_dash/page.jsx', 'utf8');

// Fix line 614 - replace the entire problematic section
let lines2 = content2.split('\n');
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('className={`px-3 py-1.5') && lines2[i].includes('transition-colors')) {
    lines2[i] = '                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${';
  }
}
fs.writeFileSync('src/app/testing_dash/page.jsx', lines2.join('\n'), 'utf8');
console.log('Fixed testing_dash/page.jsx');

console.log('All fixes complete!');
