'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function EnhancedSmartDelegationVisual({ activeFeature }) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  const teamMembers = [
    { id: 1, name: 'Sarah', color: '#10B981', workload: 60, skills: ['Frontend', 'UI/UX'] },
    { id: 2, name: 'David', color: '#F59E0B', workload: 85, skills: ['Backend', 'API'] },
    { id: 3, name: 'Alex', color: '#3B82F6', workload: 40, skills: ['DevOps', 'Testing'] },
    { id: 4, name: 'Emma', color: '#8B5CF6', workload: 70, skills: ['Design', 'Frontend'] }
  ];

  const tasks = [
    { id: 1, title: 'Design UI mockups', assignee: 'Emma', status: 'done' },
    { id: 2, title: 'Build API endpoints', assignee: 'David', status: 'progress' },
    { id: 3, title: 'Setup deployment', assignee: 'Alex', status: 'todo' },
    { id: 4, title: 'Implement frontend', assignee: 'Sarah', status: 'progress' }
  ];

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 70%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        
        setAnimationPhase(1);
        setTimeout(() => setAnimationPhase(2), 800);
        setTimeout(() => setAnimationPhase(3), 1600);
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (activeFeature && containerRef.current) {
      setAnimationPhase(0);
      setTimeout(() => setAnimationPhase(1), 200);
      setTimeout(() => setAnimationPhase(2), 600);
      setTimeout(() => setAnimationPhase(3), 1000);
    }
  }, [activeFeature]);

  const getWorkloadColor = (workload) => {
    if (workload < 50) return '#10B981';
    if (workload < 80) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {activeFeature !== 'balanced' && activeFeature !== 'sync' && (
        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-3xl p-8 shadow-2xl hover:border-gray-700/50 transition-all duration-500">
          <div className={`bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-[#4C3BCF]/30 transition-all duration-700 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-[#6B5FE8] rounded-lg flex items-center justify-center shadow-lg shadow-[#4C3BCF]/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">High-Level Goal</div>
                <div className="text-white font-semibold">Launch payment gateway by Friday</div>
              </div>
              {animationPhase >= 2 && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          </div>

          {activeFeature === 'auto-assign' && animationPhase >= 2 && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4C3BCF] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Auto-assigning tasks...
              </div>
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/30 flex items-center gap-3 transition-all duration-500 hover:border-[#4C3BCF]/30 hover:scale-[1.02] ${animationPhase >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                  style={{ transitionDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: teamMembers.find(m => m.name === task.assignee)?.color }}>
                    {task.assignee[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{task.title}</div>
                    <div className="text-xs text-gray-400">Assigned to {task.assignee}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    task.status === 'done' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    task.status === 'progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {task.status === 'done' ? '✓ Done' : task.status === 'progress' ? '⟳ In Progress' : '○ To Do'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!activeFeature && animationPhase >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              {tasks.slice(0, 4).map((task, idx) => (
                <div
                  key={task.id}
                  className={`bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/30 transition-all duration-500 hover:border-[#4C3BCF]/30 hover:scale-105 hover:shadow-lg hover:shadow-[#4C3BCF]/20 ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-xs text-white font-medium mb-2">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110"
                      style={{ backgroundColor: teamMembers.find(m => m.name === task.assignee)?.color }}>
                      {task.assignee[0]}
                    </div>
                    <div className="text-xs text-gray-400">{task.assignee}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeFeature === 'balanced' && (
        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-[#6B5FE8] rounded-lg flex items-center justify-center shadow-lg shadow-[#4C3BCF]/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Team Workload</div>
                <div className="text-white font-semibold">Balanced Distribution</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {teamMembers.map((member, idx) => (
              <div
                key={member.id}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/30 hover:border-gray-700/50 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  animation: `slideInRight 0.6s ease-out ${idx * 0.15}s both`
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: member.color }}>
                    {member.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.skills.join(', ')}</div>
                  </div>
                  <div className="text-sm font-bold transition-all" style={{ color: getWorkloadColor(member.workload) }}>
                    {member.workload}%
                  </div>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${member.workload}%`,
                      backgroundColor: getWorkloadColor(member.workload),
                      boxShadow: `0 0 10px ${getWorkloadColor(member.workload)}40`,
                      animation: `expandWidth 1.5s ease-out ${idx * 0.2}s both`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFeature === 'sync' && (
        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-[#6B5FE8] rounded-lg flex items-center justify-center shadow-lg shadow-[#4C3BCF]/30">
                <svg className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Integration Status</div>
                <div className="text-white font-semibold">Live Sync Active</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-gray-800/30 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]" style={{ animation: 'fadeInUp 0.6s ease-out 0s both' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">Slack</div>
                  <div className="text-xs text-gray-400">Last synced: 2 min ago</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Connected</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4C3BCF] to-[#6B5FE8] rounded-full" style={{ width: '75%', animation: 'expandWidth 2s ease-out both' }} />
                </div>
                <span className="text-xs text-gray-400">3 updates</span>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-gray-800/30 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02]" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">Jira</div>
                  <div className="text-xs text-gray-400">Last synced: 5 min ago</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Connected</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4C3BCF] to-[#6B5FE8] rounded-full" style={{ width: '60%', animation: 'expandWidth 2s ease-out 0.3s both' }} />
                </div>
                <span className="text-xs text-gray-400">5 updates</span>
              </div>
            </div>

            <div className="bg-[#4C3BCF]/10 backdrop-blur-sm rounded-xl p-4 border border-[#4C3BCF]/30" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#4C3BCF] border-t-transparent rounded-full animate-spin" />
                <div>
                  <div className="text-sm text-white font-medium">Syncing progress...</div>
                  <div className="text-xs text-gray-400">Real-time updates from all integrations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expandWidth {
          from {
            width: 0;
          }
        }
      `}</style>
    </div>
  );
}
