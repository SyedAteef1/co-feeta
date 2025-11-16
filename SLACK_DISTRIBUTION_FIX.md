# 🔧 Fix Slack "invalid_team_for_non_distributed_app" Error

## Problem
Your Slack app can only be installed on the workspace where it was created. To work in production with any workspace, you need to enable **Public Distribution**.

---

## ✅ Solution: Enable Public Distribution

### Step 1: Go to Slack App Settings
🔗 https://api.slack.com/apps

### Step 2: Select Your App
- Find app with Client ID: `9633109540373.9630186738163`
- Click on it

### Step 3: Navigate to Manage Distribution
- Left sidebar → **Settings** → **Manage Distribution**

### Step 4: Fill Required Information

#### App Name
```
Feeta AI
```

#### Short Description (80 chars max)
```
AI-powered task management and team collaboration assistant
```

#### Long Description
```
Feeta AI helps teams manage projects, break down tasks, and collaborate efficiently. 

Features:
• Intelligent task breakdown and assignment
• GitHub integration for code-related tasks
• Automated follow-ups and reminders
• Team workload balancing
• Real-time collaboration

Perfect for development teams looking to streamline their workflow with AI assistance.
```

#### App Icon & Banner
- **App Icon:** 512x512px PNG (required)
- **Banner Image:** 1200x600px PNG (optional)

You can use your existing logo or create one at:
- 🎨 https://www.canva.com (free)
- 🎨 https://www.figma.com (free)

#### Developer Info
```
Developer Name: Your Name/Company
Support Email: your-email@example.com
Website: https://www.feeta-ai.com
Privacy Policy URL: https://www.feeta-ai.com/privacy
```

### Step 5: Review Scopes
Make sure these scopes are added (already in your app):
```
✅ app_mentions:read
✅ channels:read
✅ channels:join
✅ channels:history
✅ chat:write
✅ users:read
✅ team:read
✅ im:read
✅ im:write
✅ im:history
✅ groups:read
✅ groups:history
```

### Step 6: Activate Distribution
1. Scroll to bottom
2. Click **"Activate Public Distribution"**
3. Review the checklist
4. Click **"Activate"**

✅ Done! Your app can now be installed on any Slack workspace.

---

## 🧪 Test the Fix

### 1. Try Installing Again
Go to your production app:
```
https://www.feeta-ai.com
```

Click "Connect Slack" - should work now!

### 2. Verify Installation
After authorization, check:
```
https://co-feeta.onrender.com/slack/api/status
```

Should return:
```json
{
  "connected": true,
  "slack_user_id": "U..."
}
```

---

## 📝 Create Required Pages (If Needed)

### Privacy Policy (Simple Template)

Create: `frontend/src/app/privacy/page.jsx`

```jsx
export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
        <p>Feeta AI collects minimal data necessary to provide our service:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Slack user ID and workspace information</li>
          <li>GitHub repository access (when connected)</li>
          <li>Task and project data you create</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Data Usage</h2>
        <p>We use your data solely to:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Provide task management features</li>
          <li>Send notifications via Slack</li>
          <li>Integrate with your GitHub repositories</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Data Security</h2>
        <p>Your data is encrypted and stored securely. We never share your data with third parties.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p>Questions? Email us at: support@feeta-ai.com</p>
      </section>
    </div>
  );
}
```

Deploy this page to: `https://www.feeta-ai.com/privacy`

---

## 🚨 Alternative: Quick Workaround (Not Recommended)

If you can't enable distribution right now:

### Install on Development Workspace First
1. Go to: https://api.slack.com/apps
2. Select your app
3. Click **"Install to Workspace"** (top right)
4. Authorize in the workspace where app was created
5. Then try production

**Note:** This only works for that one workspace. For production, enable distribution.

---

## ✅ Checklist

- [ ] Go to Slack App settings
- [ ] Navigate to Manage Distribution
- [ ] Fill app name and descriptions
- [ ] Upload app icon (512x512px)
- [ ] Add support email
- [ ] Add privacy policy URL
- [ ] Review scopes
- [ ] Click "Activate Public Distribution"
- [ ] Test installation from production app
- [ ] Verify connection works

---

## 📞 Need Help?

If you get stuck:
1. Check Slack's distribution guide: https://api.slack.com/start/distributing
2. Verify all required fields are filled
3. Make sure redirect URLs are correct:
   - OAuth: `https://co-feeta.onrender.com/slack/oauth_redirect`
   - Events: `https://co-feeta.onrender.com/slack/events`

---

## 🎉 After Activation

Your Slack app will be publicly available! Users can:
1. Visit your website
2. Click "Connect Slack"
3. Install on ANY Slack workspace
4. Start using Feeta AI

Perfect for production! 🚀
