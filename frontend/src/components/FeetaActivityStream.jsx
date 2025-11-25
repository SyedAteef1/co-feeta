'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function FeetaActivityStream() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/feeta/activities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setActivities((await res.json()).activities || []);
  };

  const getIcon = (type) => {
    const icons = {
      task_created: '📝',
      task_assigned: '👤',
      followup_sent: '📬',
      issue_resolved: '✅',
      analysis_complete: '🔍'
    };
    return icons[type] || '🤖';
  };

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 Feeta Activity Stream</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3 p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <span className="text-xl">{getIcon(act.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-white">{act.message}</p>
              <span className="text-xs text-gray-500">{new Date(act.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
