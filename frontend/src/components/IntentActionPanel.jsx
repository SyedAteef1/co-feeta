'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function IntentActionPanel({ projectId }) {
  const [intents, setIntents] = useState([]);

  useEffect(() => {
    if (projectId) loadIntents();
  }, [projectId]);

  const loadIntents = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/intents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setIntents((await res.json()).intents || []);
  };

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 Feeta's Intent → Action</h3>
      <div className="space-y-3">
        {intents.map((intent, i) => (
          <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-400">{intent.intent}</span>
              <span className="text-xs text-gray-500">{new Date(intent.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-gray-300">{intent.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
