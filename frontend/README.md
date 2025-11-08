# Feeta Frontend

Modern Next.js frontend for the Feeta AI Task Management platform.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (pages)/
│   │   │   ├── login/          # Authentication
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── test/           # Chat interface
│   │   │   ├── ai-chat/        # Alternative chat UI
│   │   │   ├── github/         # GitHub integration
│   │   │   ├── slack/          # Slack integration
│   │   │   └── *-success/      # OAuth success pages
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Homepage
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── AITaskAssistant.jsx # AI chat component
│   │   ├── SlackConnectButton.jsx
│   │   ├── home/               # Homepage components
│   │   ├── layout/             # Layout components
│   │   ├── integrations/       # Integration components
│   │   └── ui/                 # UI primitives
│   └── lib/
│       └── utils.ts            # Utility functions
├── public/
│   └── Images/                 # Images and assets
├── package.json
└── README.md
```

## 🚀 Quick Start

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file (if needed):

```env
NEXT_PUBLIC_API_URL=https://localhost:5000
```

## 📖 Pages

### Authentication
- `/login` - User login page
- `/` - Homepage/landing page

### Main App
- `/dashboard` - Main dashboard with navigation
- `/test` - ChatGPT-style task management interface
- `/ai-chat` - Alternative chat interface

### Integrations
- `/github` - GitHub connection page
- `/github-success` - GitHub OAuth success
- `/slack` - Slack connection page
- `/slack-success` - Slack OAuth success

## 🎨 Key Components

### AITaskAssistant
Main chat interface component with:
- Message history
- AI-powered task analysis
- Task breakdown display
- Slack integration

### SlackConnectButton
Reusable Slack OAuth button

### Home Components
- HeroSection - Landing page hero
- FeaturesSection - Feature showcase
- HowItWorksSection - Process explanation
- CTASection - Call to action

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS
- **Fetch API** - HTTP client

## 📝 Code Style

### Component Structure

```jsx
'use client';
import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Effects
  }, []);
  
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### API Calls

```javascript
const response = await fetch('https://localhost:5000/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});

const result = await response.json();
```

## 🎨 Styling

Using Tailwind CSS utility classes:

```jsx
<div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
  <h1 className="text-2xl font-bold text-white">Title</h1>
</div>
```

## 🔐 Authentication

Authentication uses localStorage:

```javascript
// Save token
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Get token
const token = localStorage.getItem('token');

// Clear token
localStorage.removeItem('token');
localStorage.removeItem('user');
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual

```bash
npm run build
npm start
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### API Connection Issues
- Verify backend is running on `https://localhost:5000`
- Check browser console for CORS errors
- Accept self-signed SSL certificate

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

### Styling Issues
```bash
# Rebuild Tailwind
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch
```
