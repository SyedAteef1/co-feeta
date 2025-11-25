'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function AutopilotPanel() {
  const [actions, setActions] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    loadActions();
    const interval = setInterval(loadActions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActions = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/feeta/autopilot`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setActions(data.actions || []);
      setIsEnabled(data.enabled || false);
    }
  };

  const toggleAutopilot = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/feeta/autopilot/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadActions();
  };

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🚀 Autopilot</h3>
        <button
          onClick={toggleAutopilot}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {actions.map((act, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg">
            <div className={`w-2 h-2 rounded-full ${act.status === 'running' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <div className="flex-1">
              <p className="text-sm text-white">{act.action}</p>
              <span className="text-xs text-gray-500">{act.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
