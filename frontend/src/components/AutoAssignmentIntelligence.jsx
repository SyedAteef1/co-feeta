'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function AutoAssignmentIntelligence() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/feeta/assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setAssignments((await res.json()).assignments || []);
  };

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">🎯 Auto-Assignment Intelligence</h3>
      <div className="space-y-3">
        {assignments.map((a, i) => (
          <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{a.task_title}</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">{a.confidence}% match</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>→</span>
              <span className="text-blue-400">{a.assigned_to}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Reason: {a.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
