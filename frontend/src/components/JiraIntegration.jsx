'use client';
import { API_BASE_URL } from '@/config/api';
import { useState, useEffect } from 'react';

export default function JiraIntegration({ onConnect, isConnected }) {
  const [showModal, setShowModal] = useState(false);
  const [jiraUrl, setJiraUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!jiraUrl || !email || !apiToken) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/jira/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jira_url: jiraUrl, email, api_token: apiToken })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Jira connected successfully!');
        setShowModal(false);
        if (onConnect) onConnect();
      } else {
        alert(`❌ ${data.error || 'Failed to connect'}`);
      }
    } catch (error) {
      alert('❌ Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative group">
        <div
          onClick={() => !isConnected && setShowModal(true)}
          className={`w-8 h-8 ${isConnected ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30'} border rounded-lg backdrop-blur-sm flex items-center justify-center ${isConnected ? '' : 'cursor-pointer'} transition-all p-1.5`}
        >
          <svg className={`w-full h-full ${!isConnected ? 'opacity-50' : ''}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001z"/>
          </svg>
          {isConnected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-[#0a0a0a]"></span>}
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
          {isConnected ? 'Jira Connected' : 'Click to Connect Jira'}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Connect Jira</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Jira URL</label>
                <input
                  type="url"
                  placeholder="https://your-domain.atlassian.net"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Token</label>
                <input
                  type="password"
                  placeholder="Your Jira API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your API token from: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" className="text-blue-400 hover:underline">Atlassian Account</a>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
