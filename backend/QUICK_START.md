# ⚡ Quick Start - Vertex AI Deployment

## 🎯 TL;DR - What to Do

### 1️⃣ Test Locally (30 seconds)
```bash
cd backend
python -m uvicorn app.main:app --reload
```
✅ Should work immediately - JSON file is already configured!

---

### 2️⃣ Deploy on Render (5 minutes)

**A. Copy JSON Content**
```bash
# Windows
Get-Content app\gen-lang-client-0364393343-26c3a291d763.json -Raw | Set-Clipboard

# Mac/Linux
cat app/gen-lang-client-0364393343-26c3a291d763.json | pbcopy
```

**B. Go to Render**
1. Visit [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Select your repo

**C. Settings**
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**D. Environment Variables**
```
GCP_PROJECT_ID = gen-lang-client-0364393343
GCP_LOCATION = us-central1
GCP_CREDENTIALS_JSON = <paste JSON here>
MONGODB_URI = <your-mongodb-uri>
JWT_SECRET = <your-secret>
GITHUB_CLIENT_ID = <your-id>
GITHUB_CLIENT_SECRET = <your-secret>
```

**E. Deploy** ✅

---

## 📝 What Was Changed

### File: `app/services/ai_service.py`
- ✅ Added service account credential loading
- ✅ Supports environment variable (deployment)
- ✅ Supports local file (development)

### File: `.gitignore`
- ✅ Created to prevent committing JSON file

### Your JSON File
- ✅ Already exists: `app/gen-lang-client-0364393343-26c3a291d763.json`
- ✅ Project ID: `gen-lang-client-0364393343`
- ✅ Service Account: `feeta-367@gen-lang-client-0364393343.iam.gserviceaccount.com`

---

## ✅ Verification

### Local
```bash
# Run app
python -m uvicorn app.main:app --reload

# Check logs for:
✅ Loaded credentials from file
✅ Using VERTEX AI SDK
🔑 Credentials: ✅ Loaded
```

### Deployed
```bash
# Check Render logs for:
✅ Loaded credentials from environment variable
✅ Using VERTEX AI SDK
🔑 Credentials: ✅ Loaded
```

---

## 🚨 Important

- ❌ **NEVER** commit `gen-lang-client-0364393343-26c3a291d763.json` to GitHub
- ✅ `.gitignore` is already configured
- ✅ Use environment variables in production

---

## 📚 Full Documentation

See `VERTEX_AI_DEPLOYMENT.md` for complete guide with troubleshooting.
