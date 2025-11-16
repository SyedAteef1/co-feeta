# 🚀 Feeta Backend Deployment Guide

**Frontend Domain**: https://feeta-ai.com/  
**Backend Domain**: https://co-feeta.onrender.com ✅ DEPLOYED

## 🎯 CURRENT STATUS: Backend Deployed - Port Issue Fix Needed

---

## 📋 Current Status

### ✅ Completed
- **Backend**: ✅ Deployed at https://co-feeta.onrender.com
- **Frontend**: ✅ Already deployed at https://feeta-ai.com/
- **Database**: ✅ MongoDB Atlas connected
- **AI Services**: ✅ Gemini API + Vertex AI configured

### ⚠️ URGENT: Fix Port Binding Issue
- [ ] **Add Gunicorn to requirements.txt** (DONE ✅)
- [ ] **Update Render Start Command**
- [ ] **Commit and push changes**
- [ ] **Redeploy on Render**

### 🔧 Then Configure:
- [ ] Update OAuth callback URLs (GitHub & Slack)
- [ ] Update frontend API URL
- [ ] Update backend environment variables
- [ ] Test integrations

---

## 🚨 FIX PORT ISSUE FIRST

### Problem: "No open HTTP ports detected"
Your Flask app is running but Render can't detect the port because Flask's development server is too slow to bind.

### Solution: Use Gunicorn (Production Server)

**Step 1: Commit the updated requirements.txt**
```bash
cd backend
git add requirements.txt
git commit -m "Add gunicorn for production deployment"
git push
```

**Step 2: Update Render Start Command**
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your `co-feeta` service
3. Go to **Settings** tab
4. Find **Start Command** field
5. Change from:
   ```
   python run.py
   ```
   To:
   ```
   gunicorn --bind 0.0.0.0:$PORT --timeout 120 run:app
   ```
6. Click **Save Changes**
7. Render will automatically redeploy

**Why this works:**
- Gunicorn binds to port immediately (Render can detect it)
- `$PORT` uses Render's dynamic port variable
- `--timeout 120` gives database/scheduler time to initialize
- Production-ready (Flask's `app.run()` is only for development)

---

## 🔧 Environment Variables for Production

Copy these exact values to your deployment platform:

```bash
# Slack OAuth
SLACK_CLIENT_ID=9633109540373.9630186738163
SLACK_CLIENT_SECRET=69e39d416c0c06b8cc8313f2917e3baa

# GitHub OAuth  
GITHUB_CLIENT_ID=Ov23liW8HOEEPnzFxXtk
GITHUB_CLIENT_SECRET=dbd2d14d3a09df6355c13234e69cc4efca92c773

# URLs (PRODUCTION VALUES)
BASE_URL=https://co-feeta.onrender.com
FRONTEND_URL=https://feeta-ai.com

# Security
FLASK_SECRET=your_production_secret_key_change_this

# Database
MONGO_URI=mongodb+srv://syedakousar222:youjv72XqW9Inn8n@amreen.j1fof.mongodb.net/feeta?retryWrites=true&w=majority

# AI Services
GLM_API_KEY=4a43bbdf5a3a4a5bbb516587f98e0ade.u3PVEF2mcYkN36zf
GEMINI_API_KEY=AIzaSyCcQaXGOgPAmJcKm042upp__PmCycErO1g
GCP_PROJECT_ID=gen-lang-client-0364393343
GCP_LOCATION=us-central1

# Google Cloud Credentials (see below for setup)
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
```

---

## 🎯 Step 1: Update Backend Environment Variables ⚠️ REQUIRED

In your Render dashboard, update these environment variables:

```bash
# Update these two URLs
BASE_URL=https://co-feeta.onrender.com
FRONTEND_URL=https://feeta-ai.com

# Generate new production secret
FLASK_SECRET=your_new_production_secret
```

**Generate Flask Secret:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🎯 Step 2: Update OAuth Apps ⚠️ REQUIRED

### 2.1 Update GitHub OAuth App
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Find your app with Client ID: `Ov23liW8HOEEPnzFxXtk`
3. Update **Authorization callback URL**:
   ```
   https://co-feeta.onrender.com/github/callback
   ```

### 2.2 Update Slack App
1. Go to https://api.slack.com/apps
2. Find your app with Client ID: `9633109540373.9630186738163`
3. Update **OAuth & Permissions** → **Redirect URLs**:
   ```
   https://co-feeta.onrender.com/slack/oauth_redirect
   ```
4. Update **Event Subscriptions** → **Request URL**:
   ```
   https://co-feeta.onrender.com/slack/events
   ```

---

## 🎯 Step 3: Update Frontend Configuration ⚠️ REQUIRED

Your frontend at https://feeta-ai.com/ needs to point to the new backend:

### Update Frontend Environment Variable
Change the API URL in your frontend deployment:
```bash
NEXT_PUBLIC_API_URL=https://co-feeta.onrender.com
```

**If using Vercel:**
1. Go to Vercel dashboard
2. Find your feeta-ai.com project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL`
5. Redeploy

---

## 🎯 Step 4: Test Everything ⚠️ REQUIRED

### 4.1 Basic Health Check
Visit: `https://co-feeta.onrender.com/health`
Should return: `{"status": "healthy"}`

### 4.2 Test GitHub OAuth
1. Go to https://feeta-ai.com/
2. Click "Connect GitHub"
3. Should redirect to GitHub → back to your app

### 4.3 Test Slack Integration
1. Go to https://feeta-ai.com/
2. Click "Connect Slack"  
3. Should redirect to Slack → back to your app
4. In Slack, mention `@Feeta` in a channel
5. Bot should respond in thread

---

## 🐛 Troubleshooting

### Issue: "No open HTTP ports detected"
**Cause**: Flask development server doesn't bind to port fast enough for Render

**Solution**: 
1. Add `gunicorn==21.2.0` to requirements.txt ✅ DONE
2. Update Render Start Command to: `gunicorn --bind 0.0.0.0:$PORT --timeout 120 run:app`
3. Commit, push, and redeploy

### Issue: OAuth Redirects Fail
**Solution**: Ensure callback URLs match exactly:
- GitHub: `https://co-feeta.onrender.com/github/callback`
- Slack: `https://co-feeta.onrender.com/slack/oauth_redirect`

### Issue: Slack Events Not Working
**Solution**: 
1. Check Event Subscriptions URL: `https://co-feeta.onrender.com/slack/events`
2. Slack will verify this endpoint - ensure it returns 200 OK

### Issue: CORS Errors
**Solution**: Update CORS origins to include `https://feeta-ai.com`

### Issue: Database Connection Fails
**Solution**: Add Render IP to MongoDB Atlas whitelist or allow all IPs (0.0.0.0/0)

---

## 📞 Quick Commands

### Generate Flask Secret
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Test Backend Health
```bash
curl https://co-feeta.onrender.com/health
```

### Check Logs (Render Dashboard)
Go to your service → Logs tab

---

## ✅ Deployment Checklist

### Immediate Actions:
- [x] Add gunicorn to requirements.txt
- [ ] Commit and push changes
- [ ] Update Render Start Command to use gunicorn
- [ ] Wait for successful deployment
- [ ] Test health endpoint

### Configuration:
- [ ] Update environment variables (BASE_URL, FRONTEND_URL, FLASK_SECRET)
- [ ] Update GitHub OAuth callback URL
- [ ] Update Slack OAuth redirect URLs
- [ ] Update frontend API URL
- [ ] Test all integrations

---

## 🎉 Once Complete

Your Feeta app will be fully functional with:
1. **Backend**: Running on Render with HTTPS
2. **Frontend**: Already at https://feeta-ai.com/
3. **Database**: MongoDB Atlas (existing)
4. **OAuth**: GitHub + Slack configured
5. **AI**: Gemini + Vertex AI ready
