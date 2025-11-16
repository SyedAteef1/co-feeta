'use client';
import { useState } from 'react';

export default function TaskFollowupButton({ task, onFollowupSent }) {
  const [isSending, setIsSending] = useState(false);

  const handleFollowup = async () => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://localhost:5000/api/tasks/${task.id}/follow-up`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Follow-up sent!');
        if (onFollowupSent) onFollowupSent();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Error sending follow-up');
    } finally {
      setIsSending(false);
    }
  };

  const getLastChecked = () => {
    if (!task.last_followup_at) return null;
    
    const lastCheck = new Date(task.last_followup_at);
    const now = new Date();
    const diffMs = now - lastCheck;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const lastChecked = getLastChecked();

  return (
    <div className="flex items-center gap-2">
      {lastChecked && (
        <span className="text-xs text-gray-500">
          Last checked: {lastChecked}
        </span>
      )}
      <button
        onClick={handleFollowup}
        disabled={isSending || !task.slack_channel_id}
        className="px-3 py-1.5 text-xs bg-[#4C3BCF]/20 text-[#4C3BCF] border border-[#4C3BCF]/30 rounded-lg hover:bg-[#4C3BCF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        title={!task.slack_channel_id ? 'Task not sent to Slack yet' : 'Send follow-up message'}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 2V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        {isSending ? 'Sending...' : 'Follow-up'}
      </button>
    </div>
  );
}
