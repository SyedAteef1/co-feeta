'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SlackMonitor() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [channelSummary, setChannelSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const intervalRef = useRef(null);

  useEffect(() => {
    checkAuth();
    fetchChannels();

    // Visibility change handler
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-refresh every 60 seconds when page is visible and channel is selected
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isVisible && selectedChannel) {
      // Initial fetch
      fetchChannelSummary(selectedChannel);

      // Set up 1-minute interval
      intervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing Slack summary...');
        fetchChannelSummary(selectedChannel);
      }, 60000); // 60 seconds = 1 minute
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, selectedChannel]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`https://localhost:5000/slack/api/list_conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchChannelSummary = async (channelId) => {
    const token = localStorage.getItem('token');
    if (!token || !channelId) return;

    setLoadingSummary(true);

    try {
      const historyRes = await fetch(`https://localhost:5000/slack/api/channel_history?channel=${channelId}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!historyRes.ok) {
        throw new Error('Failed to fetch channel history');
      }

      const historyData = await historyRes.json();
      const messages = historyData.messages || [];

      if (messages.length === 0) {
        setChannelSummary({
          overall_status: "No recent messages in this channel",
          key_updates: [],
          active_users: [],
          blockers: [],
          progress_indicators: [],
          action_items: [],
          sentiment: "neutral"
        });
        setLastUpdated(new Date());
        setLoadingSummary(false);
        return;
      }

      const summaryRes = await fetch(`https://localhost:5000/slack/api/summarize_channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
      });

      if (!summaryRes.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await summaryRes.json();
      setChannelSummary(summaryData.summary);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching summary:", error);
      setChannelSummary({
        overall_status: "Error loading summary",
        error: error.message
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#212121] text-white">
      {/* Header */}
      <div className="bg-[#171717] border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/test')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <Image src="/Images/F2.png" alt="Logo" width={32} height={32} className="rounded-md" />
              <div>
                <h1 className="text-2xl font-bold">Slack Channel Monitor</h1>
                <p className="text-sm text-gray-400">Real-time activity summary • Refreshes every 1 minute</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isVisible && (
              <span className="text-sm text-yellow-400">⏸️ Paused (page hidden)</span>
            )}
            {isVisible && selectedChannel && (
              <span className="text-sm text-green-400">🟢 Live monitoring</span>
            )}
            <div className="text-sm text-gray-400">
              {user?.name || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Channel Selection */}
        <div className="bg-[#2A2A2A] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Channel to Monitor</h2>
          <div className="flex gap-3">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="flex-1 bg-[#40414F] border border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">-- Select Channel --</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedChannel && fetchChannelSummary(selectedChannel)}
              disabled={!selectedChannel || loadingSummary}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              {loadingSummary ? '🔄 Loading...' : '🔍 Refresh Now'}
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-sm text-gray-400 mb-4 text-center">
            Last updated: {formatTime(lastUpdated)}
            {isVisible && selectedChannel && ' • Auto-refreshing every 60 seconds'}
          </div>
        )}

        {/* Summary Display */}
        {channelSummary && selectedChannel && (
          <div className="bg-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-400">📊 Channel Activity Summary</h2>
              {loadingSummary && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Overall Status */}
              <div className="p-4 bg-[#343541] rounded-lg border-l-4 border-purple-500">
                <div className="text-sm font-medium text-purple-300 mb-2">📌 Overall Status</div>
                <div className="text-lg text-gray-100">{channelSummary.overall_status}</div>
                {channelSummary.sentiment && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-400">Sentiment:</span>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      channelSummary.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                      channelSummary.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {channelSummary.sentiment === 'positive' ? '😊 Positive' :
                       channelSummary.sentiment === 'negative' ? '😟 Negative' :
                       '😐 Neutral'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Updates */}
                {channelSummary.key_updates && channelSummary.key_updates.length > 0 && (
                  <div className="p-4 bg-[#343541] rounded-lg">
                    <div className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                      💬 Key Updates
                      <span className="text-xs text-gray-500">({channelSummary.key_updates.length})</span>
                    </div>
                    <div className="space-y-2">
                      {channelSummary.key_updates.map((update, idx) => (
                        <div key={idx} className="text-sm text-gray-300 p-2 bg-[#40414F] rounded">
                          <span className="font-medium text-purple-200">{update.user}:</span> {update.update}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Users */}
                {channelSummary.active_users && channelSummary.active_users.length > 0 && (
                  <div className="p-4 bg-[#343541] rounded-lg">
                    <div className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                      👥 Active Users
                      <span className="text-xs text-gray-500">({channelSummary.active_users.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {channelSummary.active_users.map((user, idx) => (
                        <span key={idx} className="text-sm px-3 py-1 bg-purple-600/20 text-purple-200 rounded-full">
                          {user}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Indicators */}
                {channelSummary.progress_indicators && channelSummary.progress_indicators.length > 0 && (
                  <div className="p-4 bg-[#343541] rounded-lg">
                    <div className="text-sm font-medium text-green-400 mb-3">✅ Progress Updates</div>
                    <ul className="space-y-2">
                      {channelSummary.progress_indicators.map((progress, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{progress}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Blockers */}
                {channelSummary.blockers && channelSummary.blockers.length > 0 && (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <div className="text-sm font-medium text-red-400 mb-3">🚫 Blockers & Issues</div>
                    <ul className="space-y-2">
                      {channelSummary.blockers.map((blocker, idx) => (
                        <li key={idx} className="text-sm text-red-300 flex items-start gap-2">
                          <span className="text-red-400 mt-1">⚠️</span>
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {channelSummary.action_items && channelSummary.action_items.length > 0 && (
                  <div className="p-4 bg-[#343541] rounded-lg col-span-full">
                    <div className="text-sm font-medium text-yellow-400 mb-3">📋 Action Items</div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {channelSummary.action_items.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 p-2 bg-[#40414F] rounded">
                          <span className="text-yellow-400">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Info Footer */}
              <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-700">
                <p>📊 Analyzing last 50 messages • 🤖 AI-powered by Gemini</p>
                <p className="mt-1">
                  {isVisible ? '🟢 Auto-refreshing every 60 seconds' : '⏸️ Auto-refresh paused (page hidden)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedChannel && !channelSummary && (
          <div className="bg-[#2A2A2A] rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Select a Channel to Start Monitoring</h3>
            <p className="text-gray-400">Choose a Slack channel above to see real-time activity summaries</p>
          </div>
        )}
      </div>
    </div>
  );
}



















