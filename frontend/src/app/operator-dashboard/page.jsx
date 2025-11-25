'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import IntentActionPanel from '@/components/IntentActionPanel';
import FeetaActivityStream from '@/components/FeetaActivityStream';
import ClarifyingQuestionsCenter from '@/components/ClarifyingQuestionsCenter';
import AutoAssignmentIntelligence from '@/components/AutoAssignmentIntelligence';
import AutopilotPanel from '@/components/AutopilotPanel';
import RepoIntelligence from '@/components/RepoIntelligence';
import FeetaSummaries from '@/components/FeetaSummaries';

export default function OperatorDashboard() {
  const [user, setUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      router.push('/login');
      return;
    }
    
    const data = await res.json();
    setUser(data.user);
    loadProjects();
  };

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0) setSelectedProject(data.projects[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🤖 Feeta AI Operator</h1>
          <p className="text-gray-400">Your autonomous project manager</p>
        </div>

        <div className="mb-6">
          <select
            value={selectedProject?._id || ''}
            onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <IntentActionPanel projectId={selectedProject?._id} />
          <FeetaActivityStream />
          <AutopilotPanel />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <ClarifyingQuestionsCenter />
          <AutoAssignmentIntelligence />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <RepoIntelligence projectId={selectedProject?._id} />
          <FeetaSummaries />
        </div>
      </div>
    </div>
  );
}
