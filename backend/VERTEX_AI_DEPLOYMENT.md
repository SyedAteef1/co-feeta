# 🚀 Vertex AI Deployment Guide

## ✅ What Has Been Done

### 1. Code Updates
- ✅ Updated `app/services/ai_service.py` to support service account credentials
- ✅ Added support for both environment variable (deployment) and file-based (local) credentials
- ✅ Created `.gitignore` to prevent committing sensitive files
- ✅ Service account JSON file already exists: `gen-lang-client-0364393343-26c3a291d763.json`

### 2. Current Setup
- **GCP Project**: Already configured
- **Service Account**: Already created
- **Credentials File**: `app/gen-lang-client-0364393343-26c3a291d763.json`
- **Vertex AI SDK**: Already installed and configured

---

## 📋 What You Need to Do Next

### Step 1: Test Locally (2 minutes)

Your app should already work locally since the JSON file is in place.

```bash
# Navigate to backend folder
cd backend

# Set environment variables (optional - code will auto-detect the JSON file)
# Windows PowerShell
$env:GCP_PROJECT_ID = "gen-lang-client-0364393343"
$env:GCP_LOCATION = "us-central1"

# Mac/Linux
export GCP_PROJECT_ID="gen-lang-client-0364393343"
export GCP_LOCATION="us-central1"

# Run the app
python -m uvicorn app.main:app --reload
```

**Expected Output:**
```
✅ Loaded credentials from file: app/gen-lang-client-0364393343-26c3a291d763.json
✅ Using VERTEX AI SDK
📦 Project: gen-lang-client-0364393343
🌍 Location: us-central1
🔑 Credentials: ✅ Loaded
```

---

### Step 2: Prepare for Deployment (5 minutes)

#### A. Get JSON Content for Environment Variable

```bash
# Windows PowerShell
Get-Content app\gen-lang-client-0364393343-26c3a291d763.json -Raw | Set-Clipboard

# Mac/Linux
cat app/gen-lang-client-0364393343-26c3a291d763.json | pbcopy

# Or manually open the file and copy all content
```

#### B. Ensure .gitignore is Working

```bash
# Check git status - JSON file should NOT appear
git status

# If it appears, remove it from git
git rm --cached app/gen-lang-client-0364393343-26c3a291d763.json

# Commit the changes
git add .
git commit -m "Add Vertex AI deployment support"
git push
```

---

### Step 3: Deploy on Render (10 minutes)

#### A. Create New Web Service

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Select `co-feeta3` repository

#### B. Configure Build Settings

- **Name**: `feeta-backend`
- **Region**: `Oregon (US West)` or closest to you
- **Branch**: `main` or `master`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### C. Add Environment Variables

Click **Environment** → **Add Environment Variable**

```
GCP_PROJECT_ID = gen-lang-client-0364393343
GCP_LOCATION = us-central1
GCP_CREDENTIALS_JSON = <paste entire JSON content here>
MONGODB_URI = <your-mongodb-uri>
JWT_SECRET = <your-jwt-secret>
GITHUB_CLIENT_ID = <your-github-client-id>
GITHUB_CLIENT_SECRET = <your-github-client-secret>
```

**Important**: For `GCP_CREDENTIALS_JSON`, paste the ENTIRE content of your JSON file (including all the curly braces).

#### D. Deploy

Click **Create Web Service** and wait for deployment (3-5 minutes).

---

### Step 4: Verify Deployment (2 minutes)

Once deployed, check the logs:

```
✅ Loaded credentials from environment variable
✅ Using VERTEX AI SDK
📦 Project: gen-lang-client-0364393343
🔑 Credentials: ✅ Loaded
```

Test the API:
```bash
curl https://your-app.onrender.com/health
```

---

## 🔄 Alternative: Deploy on Railway

### Quick Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add environment variables
railway variables set GCP_PROJECT_ID=gen-lang-client-0364393343
railway variables set GCP_LOCATION=us-central1
railway variables set GCP_CREDENTIALS_JSON="$(cat app/gen-lang-client-0364393343-26c3a291d763.json)"

# Deploy
railway up
```

---

## 🔄 Alternative: Deploy on Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create feeta-backend

# Set environment variables
heroku config:set GCP_PROJECT_ID=gen-lang-client-0364393343
heroku config:set GCP_LOCATION=us-central1
heroku config:set GCP_CREDENTIALS_JSON="$(cat app/gen-lang-client-0364393343-26c3a291d763.json)"

# Deploy
git push heroku main
```

---

## 🔒 Security Checklist

- ✅ `.gitignore` created - JSON file won't be committed
- ✅ Credentials loaded from environment variables in production
- ✅ Local development uses file-based credentials
- ⚠️ **Never commit** `gen-lang-client-0364393343-26c3a291d763.json` to GitHub
- ⚠️ **Rotate keys** every 90 days (optional but recommended)

---

## 💰 Cost Estimate

### Vertex AI Pricing
- **Free Tier**: 60 requests/minute
- **After Free Tier**: $0.075 per 1M input tokens
- **Typical Usage**: $0-5/month for small apps

### Hosting (Render)
- **Free Tier**: 750 hours/month
- **Paid Plan**: $7/month (if needed)

---

## 🐛 Troubleshooting

### Issue: "Could not load credentials"

**Solution**: Check if JSON is valid
```python
import json
with open('app/gen-lang-client-0364393343-26c3a291d763.json') as f:
    data = json.load(f)
    print("✅ JSON is valid")
```

### Issue: "Permission denied" on Vertex AI

**Solution**: Verify service account has correct role
```bash
gcloud projects get-iam-policy gen-lang-client-0364393343 \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/aiplatform.user"
```

### Issue: Deployment fails on Render

**Solution**: Check logs in Render dashboard
- Ensure `GCP_CREDENTIALS_JSON` is set correctly
- Verify all required environment variables are present
- Check if `requirements.txt` includes `google-cloud-aiplatform`

---

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure the JSON file is valid
4. Test locally first before deploying

---

## 🎉 Summary

**What's Done:**
- ✅ Code updated to support Vertex AI with service account
- ✅ Local development ready (uses JSON file)
- ✅ Deployment ready (uses environment variable)

**What You Need to Do:**
1. Test locally (should work immediately)
2. Copy JSON content
3. Deploy on Render/Railway/Heroku
4. Set environment variables
5. Verify deployment

**Estimated Time**: 15-20 minutes total
