"use client";
import { useState, useEffect } from "react";

export default function SlackConnectButton() {
  const [slackConnected, setSlackConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSlackStatus();
    
    // Check URL params for Slack callback
    const params = new URLSearchParams(window.location.search);
    const slackUserId = params.get('user_id');
    const slackTeamId = params.get('team_id');
    
    if (slackUserId && slackTeamId) {
      connectSlackToUser(slackUserId, slackTeamId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkSlackStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const res = await fetch('https://localhost:5000/slack/api/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Slack status response:', data);
      setSlackConnected(data.connected);
      if (data.connected) {
        localStorage.setItem('slack_user_id', data.slack_user_id);
      }
    } catch (err) {
      console.error('Error checking Slack status:', err);
    }
    setChecking(false);
  };

  const connectSlackToUser = async (slackUserId, slackTeamId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('https://localhost:5000/api/slack/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slack_user_id: slackUserId,
          slack_team_id: slackTeamId
        })
      });
      localStorage.setItem('slack_user_id', slackUserId);
      setSlackConnected(true);
    } catch (err) {
      console.error('Error connecting Slack:', err);
    }
  };

  const handleConnect = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first");
      return;
    }
    window.location.href = `https://localhost:5000/slack/install?token=${token}`;
  };

  if (checking) return null;

  return slackConnected ? (
    <span className="text-sm text-green-400">✓ Slack</span>
  ) : (
    <button
      onClick={handleConnect}
      className="text-sm bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
    >
      Connect Slack
    </button>
  );
}
