'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function ProjectsView({ 
  selectedProject, 
  user, 
  githubConnected, 
  slackConnected,
  onShowRepoModal,
  onShowApprovalModal 
}) {
  const [intentInput, setIntentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [teamAvailability, setTeamAvailability] = useState([]);
  const [repoIntelligence, setRepoIntelligence] = useState(null);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  const loadProjectData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedProject) return;

    const projectId = selectedProject._id || selectedProject.id;

    try {
      // Load tasks
      const tasksRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      // Load activities
      const activitiesRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
      }

      // Load team availability
      const teamRes = await fetch(`${API_BASE_URL}/api/teams/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamAvailability(data.members || []);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const handleIntentSubmit = async () => {
    if (!intentInput.trim() || !selectedProject) return;

    setIsProcessing(true);
    const token = localStorage.getItem('token');
    const projectId = selectedProject._id || selectedProject.id;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ intent: intentInput })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to activities
        setActivities(prev => [{
          type: 'intent_processed',
          message: `Feeta processed: "${intentInput}"`,
          timestamp: new Date().toISOString(),
          data: data
        }, ...prev]);

        // If clarifications needed
        if (data.clarifications) {
          setClarifications(prev => [...prev, ...data.clarifications]);
        }

        // If tasks created
        if (data.tasks) {
          setTasks(prev => [...prev, ...data.tasks]);
        }

        setIntentInput('');
        loadProjectData();
      }
    } catch (error) {
      console.error('Error processing intent:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No project selected</p>
          <p className="text-sm text-gray-500">Select a project from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Intent → Action Panel */}
      <div className="border-b border-[#1f1f1f] p-6 bg-[#0f0f0f]/60 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">INTENT → ACTION</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={intentInput}
            onChange={(e) => setIntentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleIntentSubmit()}
            placeholder="Tell Feeta what you want to achieve in this project..."
            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#4C3BCF] transition-colors"
            disabled={isProcessing}
          />
          <button
            onClick={handleIntentSubmit}
            disabled={!intentInput.trim() || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Execute'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Feeta will analyze, create tasks, assign team members, and detect blockers automatically
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left: Feeta Activity Feed */}
        <div className="col-span-4 flex flex-col bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
            <h3 className="font-semibold">Feeta Activity Feed</h3>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">Live</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <p>No activity yet</p>
                <p className="text-xs mt-2">Activity will appear as Feeta works on your project</p>
              </div>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4C3BCF] mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Tasks (AI-Organized) */}
        <div className="col-span-5 flex flex-col bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
            <h3 className="font-semibold">Tasks (AI-Organized)</h3>
            <button
              onClick={() => onShowApprovalModal && onShowApprovalModal()}
              className="text-xs px-3 py-1.5 bg-[#4C3BCF]/20 text-[#4C3BCF] border border-[#4C3BCF]/30 rounded-lg hover:bg-[#4C3BCF]/30 transition-all"
            >
              Review & Approve
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <p>No tasks yet</p>
                <p className="text-xs mt-2">Use the Intent panel above to create tasks</p>
              </div>
            ) : (
              tasks.map((task, idx) => (
                <div key={idx} className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{task.title || task.task}</h4>
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {task.assigned_to && (
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M3 13C3 11 5 9.5 8 9.5C11 9.5 13 11 13 13" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <span className="text-[#4C3BCF]">{task.assigned_to}</span>
                      </div>
                    )}
                    {task.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <span>{task.estimated_hours}h</span>
                      </div>
                    )}
                    {task.confidence_score && (
                      <div className="flex items-center gap-1">
                        <span className={`${
                          task.confidence_score > 80 ? 'text-green-400' :
                          task.confidence_score > 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {task.confidence_score}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Clarifications & Blockers */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Clarifying Questions */}
          <div className="flex-1 flex flex-col bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f1f1f]">
              <h3 className="font-semibold text-sm">Clarifying Questions</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {clarifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <p>No clarifications needed</p>
                </div>
              ) : (
                clarifications.map((q, idx) => (
                  <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400 font-medium mb-2">{q.question}</p>
                    <input
                      type="text"
                      placeholder="Your answer..."
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blockers & Risks */}
          <div className="flex-1 flex flex-col bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f1f1f]">
              <h3 className="font-semibold text-sm">Blockers & Risks</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {blockers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <p>No blockers detected</p>
                </div>
              ) : (
                blockers.map((blocker, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">{blocker.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Team Availability & Repo Intelligence */}
      <div className="border-t border-[#1f1f1f] p-6 bg-[#0f0f0f]/60 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-6">
          {/* Team Availability */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">TEAM AVAILABILITY</h3>
            <div className="flex gap-3 overflow-x-auto">
              {teamAvailability.map((member, idx) => (
                <div key={idx} className="flex-shrink-0 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] flex items-center justify-center text-white text-xs font-bold">
                      {member.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role || 'Developer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-lg ${
                      member.idle_percentage > 60 ? 'bg-green-500/20 text-green-400' :
                      member.idle_percentage > 30 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {member.idle_percentage?.toFixed(0)}% idle
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repo Intelligence */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">REPO INTELLIGENCE</h3>
            <div className="flex gap-3">
              {selectedProject.repos && selectedProject.repos.length > 0 ? (
                selectedProject.repos.map((repo, idx) => (
                  <div key={idx} className="flex-1 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">{repo.name}</p>
                    <p className="text-xs text-gray-500">{repo.full_name}</p>
                  </div>
                ))
              ) : (
                <button
                  onClick={() => onShowRepoModal && onShowRepoModal()}
                  className="flex-1 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-all text-sm text-gray-400 hover:text-white"
                >
                  Connect Repositories
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
