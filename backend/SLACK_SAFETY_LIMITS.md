# Slack Auto-Response Safety Guide 🛡️

## Current Safety Features ✅

### 1. **Duplicate Prevention**
- Each mention is tracked in database with unique ID: `{channel}_{timestamp}`
- Same mention will NEVER be processed twice
- Database: `processed_mentions` collection

### 2. **Rate Limiting** (NEW)
- **10 mentions per hour per user** maximum
- Prevents spam and excessive LLM usage
- Resets every hour automatically

### 3. **Question Length Limit** (NEW)
- Maximum 500 characters per question
- Rejects very long questions (likely spam/errors)
- Prevents excessive token usage

### 4. **Token Limits** (NEW)
- Output limited to 512 tokens (~300-400 words)
- Reduced from 2048 tokens (75% cost savings)
- Still provides complete answers

### 5. **Manual Control**
- Auto-fetch runs every 1 minute BUT only when you trigger it
- You control when the monitoring is active
- Can stop anytime from frontend

## Cost Protection 💰

### Vertex AI Pricing (Google Cloud)
- **Free tier**: 60 requests/minute
- **After free tier**: ~$0.00025 per 1K characters
- With 512 token limit: ~$0.0001 per response

### Example Costs:
- 10 mentions/hour = ~$0.001/hour
- 100 mentions/day = ~$0.01/day  
- 1000 mentions/month = ~$0.10/month

**Much cheaper than OpenAI!**

## How to Control It 🎮

### Option 1: Manual Trigger Only (SAFEST)
```javascript
// In frontend - only check when button clicked
<button onClick={checkMentions}>Check for Mentions</button>
```

### Option 2: Auto-Check with ON/OFF Toggle (RECOMMENDED)
```javascript
// Add toggle in frontend
const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);

useEffect(() => {
  if (!autoCheckEnabled) return;
  
  const interval = setInterval(checkMentions, 60000); // 1 min
  return () => clearInterval(interval);
}, [autoCheckEnabled]);
```

### Option 3: Add Daily Limit (MAXIMUM SAFETY)
Add to `config.py`:
```python
# Maximum LLM calls per day
MAX_DAILY_MENTIONS = 50  # Adjust as needed
```

## Monitoring Usage 📊

Check processed mentions:
```javascript
// API endpoint to get today's count
GET /slack/api/mention-stats
Response: {
  "today": 15,
  "this_hour": 3,
  "total": 150
}
```

## Emergency Stop 🚨

If something goes wrong:

1. **Stop auto-fetch** - Turn off toggle in frontend
2. **Check database** - See what was processed
3. **Clear if needed** - Delete from `processed_mentions` collection

## Recommendations ✅

For your use case, I recommend:

1. ✅ Keep current safety limits (10/hour per user)
2. ✅ Use manual trigger initially to test
3. ✅ Add ON/OFF toggle for auto-check
4. ✅ Monitor for 1 week before full automation
5. ✅ Set up Google Cloud billing alerts ($1/day threshold)

## Current Status

- ✅ Duplicate prevention: ACTIVE
- ✅ Rate limiting: ACTIVE (10/hour)
- ✅ Token limits: ACTIVE (512 tokens)
- ✅ Question length: ACTIVE (500 chars max)
- ⚠️ Daily limit: NOT IMPLEMENTED (optional)
- ⚠️ Auto-check toggle: NOT IMPLEMENTED (recommended)

**Your credits are SAFE with current setup!** 🎉
