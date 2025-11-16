# 🚀 Production Deployment Checklist

## Your URLs
- **Backend:** https://co-feeta.onrender.com
- **Frontend:** https://www.feeta-ai.com

---

## ✅ Step 1: GitHub OAuth Setup

### 1. Go to GitHub Developer Settings
🔗 https://github.com/settings/developers

### 2. Find Your OAuth App
- Look for app with Client ID: `Ov23liW8HOEEPnzFxXtk`
- Or create new one if needed

### 3. Update These Fields:
```
Homepage URL: https://www.feeta-ai.com
Authorization callback URL: https://co-feeta.onrender.com/github/callback
```

### 4. Save Changes
✅ Click "Update application"

---

## ✅ Step 2: Slack App Setup

### 1. Go to Slack API Dashboard
🔗 https://api.slack.com/apps

### 2. Select Your App
- Look for app with Client ID: `9633109540373.9630186738163`

### 3. Update OAuth & Permissions
Navigate to: **OAuth & Permissions** (left sidebar)

**Redirect URLs:**
```
https://co-feeta.onrender.com/slack/oauth_redirect
```

Click "Add New Redirect URL" → Paste URL → "Add" → "Save URLs"

### 4. Update Event Subscriptions
Navigate to: **Event Subscriptions** (left sidebar)

**Request URL:**
```
https://co-feeta.onrender.com/slack/events
```

Slack will verify this URL (make sure your backend is deployed first!)

### 5. Update Interactivity
Navigate to: **Interactivity & Shortcuts** (left sidebar)

**Request URL:**
```
https://co-feeta.onrender.com/slack/interactions
```

---

## ✅ Step 3: Backend Environment Variables (Render)

### 1. Go to Render Dashboard
🔗 https://dashboard.render.com

### 2. Select Your Backend Service
Find: `co-feeta` service

### 3. Go to Environment Tab
Click "Environment" in left sidebar

### 4. Add/Update These Variables:
```bash
# URLs (CRITICAL - Update these!)
BASE_URL=https://co-feeta.onrender.com
FRONTEND_URL=https://www.feeta-ai.com

# Security (Generate new secret!)
FLASK_SECRET=<generate-new-64-char-secret>

# Database
MONGO_URI=mongodb+srv://syedakousar222:youjv72XqW9Inn8n@amreen.j1fof.mongodb.net/feeta?retryWrites=true&w=majority

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23liW8HOEEPnzFxXtk
GITHUB_CLIENT_SECRET=dbd2d14d3a09df6355c13234e69cc4efca92c773

# Slack OAuth
SLACK_CLIENT_ID=9633109540373.9630186738163
SLACK_CLIENT_SECRET=69e39d416c0c06b8cc8313f2917e3baa

# AI Services
GEMINI_API_KEY=AIzaSyCcQaXGOgPAmJcKm042upp__PmCycErO1g
GCP_PROJECT_ID=gen-lang-client-0364393343
GCP_LOCATION=us-central1

# Google Cloud (if using Vertex AI)
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
```

### 5. Generate New Flask Secret:
Run this locally:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Copy the output and paste as `FLASK_SECRET`

### 6. Save Changes
Click "Save Changes" - Render will auto-redeploy

---

## ✅ Step 4: Frontend Environment Variables

### If Using Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project: `feeta-ai`
3. Go to: Settings → Environment Variables
4. Add:
```bash
NEXT_PUBLIC_API_URL=https://co-feeta.onrender.com
```
5. Redeploy: Deployments → Latest → Redeploy

### If Using Netlify:

1. Go to: https://app.netlify.com
2. Select your site
3. Go to: Site settings → Environment variables
4. Add:
```bash
NEXT_PUBLIC_API_URL=https://co-feeta.onrender.com
```
5. Trigger deploy: Deploys → Trigger deploy

---

## ✅ Step 5: MongoDB Atlas (Optional but Recommended)

### 1. Go to MongoDB Atlas
🔗 https://cloud.mongodb.com

### 2. Network Access
- Go to: Network Access (left sidebar)
- Click "Add IP Address"
- Select "Allow Access from Anywhere" (0.0.0.0/0)
- Or add Render's IP ranges

### 3. Database Access
- Verify user `syedakousar222` has read/write permissions
- Password: `youjv72XqW9Inn8n`

---

## ✅ Step 6: Test Everything

### 1. Backend Health Check
```bash
curl https://co-feeta.onrender.com/health
```
Expected: `{"status": "healthy", "service": "feeta-backend"}`

### 2. Frontend Loads
Visit: https://www.feeta-ai.com
Should load without errors

### 3. GitHub OAuth Flow
1. Go to: https://www.feeta-ai.com
2. Click "Connect GitHub"
3. Should redirect to GitHub
4. Authorize app
5. Should redirect back to your app

### 4. Slack OAuth Flow
1. Go to: https://www.feeta-ai.com
2. Click "Connect Slack"
3. Should redirect to Slack
4. Select workspace
5. Should redirect back to your app

### 5. Test API Call
Open browser console on https://www.feeta-ai.com:
```javascript
fetch('https://co-feeta.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```
Should see: `{status: "healthy", service: "feeta-backend"}`

---

## ✅ Step 7: Domain Setup (If Using Custom Domain)

### For www.feeta-ai.com:

1. **DNS Records** (at your domain registrar):
```
Type: CNAME
Name: www
Value: <your-vercel-domain>.vercel.app
```

2. **Vercel Domain Settings**:
- Go to: Project Settings → Domains
- Add: `www.feeta-ai.com`
- Verify DNS

---

## 🔧 Troubleshooting

### Issue: "Redirect URI mismatch" (GitHub)
**Fix:** Double-check callback URL is exactly:
```
https://co-feeta.onrender.com/github/callback
```
No trailing slash!

### Issue: "Redirect URI mismatch" (Slack)
**Fix:** Double-check redirect URL is exactly:
```
https://co-feeta.onrender.com/slack/oauth_redirect
```

### Issue: CORS errors
**Fix:** Verify `FRONTEND_URL` in Render matches your actual frontend URL

### Issue: "Failed to fetch"
**Fix:** 
1. Check backend is running: https://co-feeta.onrender.com/health
2. Check CORS settings in backend
3. Verify `NEXT_PUBLIC_API_URL` in frontend

### Issue: Slack events not working
**Fix:**
1. Verify Event Subscriptions URL: https://co-feeta.onrender.com/slack/events
2. Check Slack can reach your backend (must return 200 OK)
3. Re-verify the URL in Slack dashboard

---

## 📋 Quick Reference

### Backend URLs to Update:
- ✅ GitHub callback: `https://co-feeta.onrender.com/github/callback`
- ✅ Slack OAuth redirect: `https://co-feeta.onrender.com/slack/oauth_redirect`
- ✅ Slack events: `https://co-feeta.onrender.com/slack/events`
- ✅ Slack interactions: `https://co-feeta.onrender.com/slack/interactions`

### Environment Variables to Update:
- ✅ Backend `BASE_URL`: `https://co-feeta.onrender.com`
- ✅ Backend `FRONTEND_URL`: `https://www.feeta-ai.com`
- ✅ Frontend `NEXT_PUBLIC_API_URL`: `https://co-feeta.onrender.com`
- ✅ Backend `FLASK_SECRET`: Generate new secret

### Services to Configure:
- ✅ GitHub OAuth App
- ✅ Slack App (OAuth, Events, Interactivity)
- ✅ Render (Environment Variables)
- ✅ Vercel/Netlify (Environment Variables)
- ✅ MongoDB Atlas (Network Access)

---

## ✨ You're Done!

Once all steps are complete:
1. ✅ Backend deployed on Render
2. ✅ Frontend deployed on Vercel/Netlify
3. ✅ GitHub OAuth configured
4. ✅ Slack OAuth configured
5. ✅ Environment variables set
6. ✅ Everything tested

Your app is now live in production! 🎉
