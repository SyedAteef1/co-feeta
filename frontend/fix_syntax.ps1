# Fix syntax errors in test/page.jsx and testing_dash/page.jsx

$testFile = "src\app\test\page.jsx"
$testingDashFile = "src\app\testing_dash\page.jsx"

# Read test/page.jsx
$content = Get-Content $testFile -Raw

# Fix all syntax errors
$content = $content -replace 'alert\(`Please select a project and connect a repository first"\);', 'alert("Please select a project and connect a repository first");'
$content = $content -replace 'setInput\(""\`\);', 'setInput("");'
$content = $content -replace 'console\.log\(`💾 User message saved to database"\);', 'console.log("💾 User message saved to database");'
$content = $content -replace '"Authorization`:', '"Authorization":'
$content = $content -replace 'aiResponse\.content = `I''ve analyzed your request: `\$\{input\}`', 'aiResponse.content = `I''ve analyzed your request: "${input}"'
$content = $content -replace 'data\.status === `ambiguous"\)', 'data.status === "ambiguous")'
$content = $content -replace 'console\.log\(`💾 AI response saved to database"\);', 'console.log("💾 AI response saved to database");'
$content = $content -replace 'console\.error\("Error saving AI response:`, error\);', 'console.error("Error saving AI response:", error);'
$content = $content -replace 'alert\("Error: Could not find the original task\. Please try again\."\`\);', 'alert("Error: Could not find the original task. Please try again.");'
$content = $content -replace 'console\.log\(`📝 Submitting answers for message:", message\);', 'console.log("📝 Submitting answers for message:", message);'
$content = $content -replace 'console\.log\(`📡 Sending to /api/generate_plan:", requestBody\);', 'console.log("📡 Sending to /api/generate_plan:", requestBody);'
$content = $content -replace 'console\.log\(`✅ Response status:", planRes\.status\);', 'console.log("✅ Response status:", planRes.status);'
$content = $content -replace 'console\.log\("📦 Plan data received:`, planData\);', 'console.log("📦 Plan data received:", planData);'
$content = $content -replace 'console\.log\(`✨ Adding AI response to messages:', 'console.log("✨ Adding AI response to messages:'
$content = $content -replace 'console\.log\(`💾 Plan saved to database"\);', 'console.log("💾 Plan saved to database");'
$content = $content -replace 'console\.error\("❌ Error from API:`, planData\.error\);', 'console.error("❌ Error from API:", planData.error);'
$content = $content -replace 'console\.error\(`❌ Error submitting answers:', 'console.error("❌ Error submitting answers:'
$content = $content -replace 'overall_status: `No recent messages in this channel",', 'overall_status: "No recent messages in this channel",'
$content = $content -replace 'sentiment: "neutral`', 'sentiment: "neutral"'
$content = $content -replace 'console\.error\(`Error fetching summary:", error\);', 'console.error("Error fetching summary:", error);'
$content = $content -replace 'const originalPrompt = conversationHistory\[conversationHistory\.length - 1\]\?\.prompt \|\| "Task`;', 'const originalPrompt = conversationHistory[conversationHistory.length - 1]?.prompt || "Task";'
$content = $content -replace 'await fetch\(`\$\{API_BASE_URL\}/slack/api/send_message", \{', 'await fetch(`${API_BASE_URL}/slack/api/send_message`, {'
$content = $content -replace 'console\.error\(`Error sending to Slack:', 'console.error("Error sending to Slack:'
$content = $content -replace 'className=`flex h-screen', 'className="flex h-screen'
$content = $content -replace 'className=`flex items-center gap-2 px-5 py-6', 'className="flex items-center gap-2 px-5 py-6'
$content = $content -replace 'className="px-3 py-4 text-xs text-gray-500 text-center`>', 'className="px-3 py-4 text-xs text-gray-500 text-center">'
$content = $content -replace 'className=`truncate font-medium">', 'className="truncate font-medium">'
$content = $content -replace 'strokeWidth="1\.5`/>', 'strokeWidth="1.5"/>'
$content = $content -replace 'width=`16"', 'width="16"'
$content = $content -replace 'className="flex-1 bg-\[#1a1a1a\] px-4 py-2 rounded-lg hover:bg-\[#222222\] transition-colors`', 'className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-lg hover:bg-[#222222] transition-colors"'
$content = $content -replace 'className=`max-w-3xl mx-auto">', 'className="max-w-3xl mx-auto">'
$content = $content -replace 'className="flex gap-4`>', 'className="flex gap-4">'
$content = $content -replace 'className=`text-sm font-bold">', 'className="text-sm font-bold">'
$content = $content -replace 'placeholder="Your answer\.\.\.\`', 'placeholder="Your answer..."'
$content = $content -replace 'className=`w-full bg-\[#111111\]', 'className="w-full bg-[#111111]'
$content = $content -replace '\{sendingAll \? "Sending\.\.\.\` : `Send', '{sendingAll ? "Sending..." : `Send'
$content = $content -replace 'className=`mt-6 p-4', 'className="mt-6 p-4'
$content = $content -replace 'className="mt-2 text-xs`>', 'className="mt-2 text-xs">'
$content = $content -replace 'className=`p-3 bg-\[#40414F\]', 'className="p-3 bg-[#40414F]'

# Write back
Set-Content $testFile -Value $content -NoNewline

Write-Host "Fixed test/page.jsx"

# Read testing_dash/page.jsx
$content2 = Get-Content $testingDashFile -Raw

# Fix template literal issue
$content2 = $content2 -replace 'className=\{`px-3 py-1\.5 rounded-lg text-sm font-medium transition-colors \$\{', 'className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${'

# Write back
Set-Content $testingDashFile -Value $content2 -NoNewline

Write-Host "Fixed testing_dash/page.jsx"
Write-Host "All syntax errors fixed!"
