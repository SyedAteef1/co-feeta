'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function FeetaSummaries() {
  const [summaries, setSummaries] = useState({ daily: null, weekly: null });
  const [view, setView] = useState('daily');

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/feeta/summaries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSummaries(await res.json());
  };

  const current = summaries[view];

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📊 Summaries</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === 'daily' ? 'bg-[#4C3BCF] text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1.5 rounded-lg text-sm ${view === 'weekly' ? 'bg-[#4C3BCF] text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
          >
            Weekly
          </button>
        </div>
      </div>
      {current && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-xs text-gray-400">Tasks Completed</p>
              <p className="text-2xl font-bold text-green-400">{current.completed}</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-xs text-gray-400">Tasks Created</p>
              <p className="text-2xl font-bold text-blue-400">{current.created}</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-xs text-gray-400">Follow-ups</p>
              <p className="text-2xl font-bold text-yellow-400">{current.followups}</p>
            </div>
          </div>
          <div className="p-4 bg-[#1a1a1a] rounded-lg">
            <p className="text-sm font-medium mb-2">AI Insights</p>
            <p className="text-sm text-gray-300">{current.insights}</p>
          </div>
        </div>
      )}
    </div>
  );
}
