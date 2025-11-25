'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function RepoIntelligence({ projectId }) {
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    if (projectId) loadRepoData();
  }, [projectId]);

  const loadRepoData = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/repo-intelligence`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setRepoData(await res.json());
  };

  if (!repoData) return null;

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">📦 Repo Intelligence</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-[#1a1a1a] rounded-lg">
            <p className="text-xs text-gray-400">Commits</p>
            <p className="text-2xl font-bold">{repoData.commits || 0}</p>
          </div>
          <div className="p-3 bg-[#1a1a1a] rounded-lg">
            <p className="text-xs text-gray-400">PRs</p>
            <p className="text-2xl font-bold">{repoData.prs || 0}</p>
          </div>
          <div className="p-3 bg-[#1a1a1a] rounded-lg">
            <p className="text-xs text-gray-400">Issues</p>
            <p className="text-2xl font-bold">{repoData.issues || 0}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Task → Code Mapping</p>
          {repoData.mappings?.map((m, i) => (
            <div key={i} className="p-2 bg-[#1a1a1a] rounded-lg mb-2">
              <p className="text-sm text-white">{m.task}</p>
              <p className="text-xs text-blue-400">→ {m.file}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
