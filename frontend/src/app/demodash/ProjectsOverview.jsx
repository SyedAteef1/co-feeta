'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function ProjectsOverview({ projects, onSelectProject }) {
  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      loadProjectsData();
    }
  }, [projects]);

  const loadProjectsData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const projectId = project._id || project.id;
        
        try {
          // Load tasks for each project
          const tasksRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          let tasks = [];
          if (tasksRes.ok) {
            const data = await tasksRes.json();
            tasks = data.tasks || [];
          }

          // Calculate AI health score
          const healthScore = calculateHealthScore(tasks);
          
          // Detect risks
          const risks = detectRisks(tasks);
          
          // Count pending clarifications
          const pendingClarifications = tasks.filter(t => t.needs_clarification).length;
          
          // Get upcoming deadlines
          const upcomingDeadlines = tasks
            .filter(t => t.deadline && new Date(t.deadline) > new Date())
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 3);

          return {
            ...project,
            tasks,
            healthScore,
            risks,
            pendingClarifications,
            upcomingDeadlines,
            progress: calculateProgress(tasks)
          };
        } catch (error) {
          console.error(`Error loading data for project ${projectId}:`, error);
          return { ...project, tasks: [], healthScore: 0, risks: [], pendingClarifications: 0, upcomingDeadlines: [], progress: 0 };
        }
      })
    );

    setProjectsData(enrichedProjects);
  };

  const calculateHealthScore = (tasks) => {
    if (!tasks || tasks.length === 0) return 100;

    let score = 100;
    const now = new Date();

    // Deduct for overdue tasks
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed');
    score -= overdueTasks.length * 10;

    // Deduct for blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    score -= blockedTasks.length * 15;

    // Deduct for low confidence tasks
    const lowConfidenceTasks = tasks.filter(t => t.confidence_score && t.confidence_score < 60);
    score -= lowConfidenceTasks.length * 5;

    return Math.max(0, Math.min(100, score));
  };

  const detectRisks = (tasks) => {
    const risks = [];
    const now = new Date();

    // Check for overdue tasks
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed');
    if (overdueTasks.length > 0) {
      risks.push({ type: 'overdue', count: overdueTasks.length, severity: 'high' });
    }

    // Check for blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    if (blockedTasks.length > 0) {
      risks.push({ type: 'blocked', count: blockedTasks.length, severity: 'high' });
    }

    // Check for unassigned tasks
    const unassignedTasks = tasks.filter(t => !t.assigned_to || t.assigned_to === 'Unassigned');
    if (unassignedTasks.length > 3) {
      risks.push({ type: 'unassigned', count: unassignedTasks.length, severity: 'medium' });
    }

    return risks;
  };

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBadge = (risk) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };

    const labels = {
      overdue: 'Overdue',
      blocked: 'Blocked',
      unassigned: 'Unassigned'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-lg border ${colors[risk.severity]}`}>
        {risk.count} {labels[risk.type]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Projects Overview</h2>
          <p className="text-gray-400 text-sm">All active projects with Feeta intelligence</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsData.length === 0 ? (
          <div className="col-span-full bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No projects yet</p>
            <p className="text-sm text-gray-500">Create your first project to get started</p>
          </div>
        ) : (
          projectsData.map((project, idx) => (
            <div
              key={idx}
              onClick={() => onSelectProject(project)}
              className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-[#6B5CE6] transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-[#4C3BCF]/20 text-[#4C3BCF] rounded-lg">
                    Operated by Feeta
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getHealthColor(project.healthScore)}`}>
                    {project.healthScore}
                  </div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Risks */}
              {project.risks && project.risks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Current Risks:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.risks.map((risk, rIdx) => (
                      <div key={rIdx}>{getRiskBadge(risk)}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
                  <div className="text-lg font-bold text-white">{project.tasks?.length || 0}</div>
                  <div className="text-xs text-gray-500">Tasks</div>
                </div>
                <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
                  <div className="text-lg font-bold text-yellow-400">{project.pendingClarifications || 0}</div>
                  <div className="text-xs text-gray-500">Clarifications</div>
                </div>
                <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
                  <div className="text-lg font-bold text-blue-400">{project.upcomingDeadlines?.length || 0}</div>
                  <div className="text-xs text-gray-500">Deadlines</div>
                </div>
              </div>

              {/* Last Activity */}
              <div className="pt-3 border-t border-[#1f1f1f]">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last AI activity</span>
                  <span>{project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
