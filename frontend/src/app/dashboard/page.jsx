'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Image src="/images/F.png" alt="Feeta Logo" width={32} height={32} className="rounded-md" />
          <h1 className="text-2xl font-bold text-blue-600">Feeta</h1>
        </div>

        <nav className="flex-1 px-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 mb-2 bg-blue-600 text-white rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Dashboard
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-gray-700 hover:bg-gray-100 rounded-lg relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Projects
            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">12</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Team
          </button>

          <button 
            onClick={() => router.push('/ai-chat')}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            AI Chat Assistant
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Reports
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>
              </div>
              <span className="font-semibold text-gray-900">AI Assistant</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Get instant insights and automate your workflow</p>
            <button onClick={() => router.push('/slack-success')} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
              <Image src="/images/F.png" alt="Feeta Logo" width={16} height={16} className="rounded-sm" />
              Ask Feeta AI
            </button>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-gray-700 mb-2">QUICK STATS</div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Active Projects</span><span className="font-semibold">8</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tasks Due Today</span><span className="font-semibold text-red-600">3</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Team Members</span><span className="font-semibold">12</span></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, {userName}! 👋</h1>
          <p className="text-gray-600 mb-8">Here's what's happening with your projects today</p>

          {/* Command Suggestions */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span>
              <h2 className="text-lg font-semibold text-gray-900">Command Suggestions</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">➕</span>
                  <span className="font-semibold text-gray-900">Create Project</span>
                </div>
                <p className="text-sm text-gray-600">"Create a new project for mobile app redesign"</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">👥</span>
                  <span className="font-semibold text-gray-900">Assign Tasks</span>
                </div>
                <p className="text-sm text-gray-600">"Assign UI mockups to John for next week"</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📊</span>
                  <span className="font-semibold text-gray-900">Generate Report</span>
                </div>
                <p className="text-sm text-gray-600">"Show me team productivity for last month"</p>
              </div>
            </div>
          </div>

          {/* Daily Briefing */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/images/F.png" alt="Feeta Logo" width={24} height={24} className="rounded" />
                  <h2 className="text-xl font-bold text-gray-900">Feeta's Daily Briefing</h2>
                </div>
              </div>
              <span className="text-sm text-gray-500">Updated 2 minutes ago</span>
            </div>

            <div className="space-y-4">
              {/* Attention Required */}
              <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">!</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Attention Required</h3>
                  </div>
                  <span className="text-sm font-medium text-red-600">High Priority</span>
                </div>
                <p className="text-gray-700 mb-4 ml-11">The Q4 Marketing Campaign is falling behind schedule. 3 critical tasks are overdue, and the current completion rate suggests a 2-week delay.</p>
                <div className="flex gap-3 ml-11">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Auto-reschedule</button>
                  <button className="text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">View details</button>
                </div>
              </div>

              {/* Great Progress */}
              <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Great Progress</h3>
                  </div>
                  <span className="text-sm font-medium text-green-600">Positive Trend</span>
                </div>
                <p className="text-gray-700 mb-4 ml-11">The API Integration project is ahead of schedule by 5 days. The development team has been highly productive this week with 95% task completion rate.</p>
                <div className="flex gap-3 ml-11">
                  <button className="text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100">Celebrate team</button>
                  <button className="text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100">View metrics</button>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="bg-yellow-50 rounded-lg p-5 border-l-4 border-yellow-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">AI Suggestion</h3>
                  </div>
                  <span className="text-sm font-medium text-yellow-700">Optimization</span>
                </div>
                <p className="text-gray-700 mb-4 ml-11">Based on team workload analysis, I recommend redistributing 2 tasks from John (120% capacity) to Emma (60% capacity) for better balance.</p>
                <div className="flex gap-3 ml-11">
                  <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">Apply suggestion</button>
                  <button className="text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100">See workload</button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <span>+</span> New Project
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Project Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mobile App Redesign</h3>
                    <p className="text-sm text-gray-500">Due: Dec 15, 2024</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">On Track</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold">75%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div></div>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-600">Tasks: 12/16</span>
                <span className="text-gray-600">Team: 5</span>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">+2</div>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">View Details →</button>
            </div>

            {/* Project Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📢</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Q4 Marketing Campaign</h3>
                    <p className="text-sm text-gray-500">Due: Nov 30, 2024</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">At Risk</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold">45%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div></div>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-600">Tasks: 8/18</span>
                <span className="text-gray-600">Team: 7</span>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">+4</div>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">View Details →</button>
            </div>

            {/* Project Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💻</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">API Integration</h3>
                    <p className="text-sm text-gray-500">Due: Dec 1, 2024</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">On Track</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold">90%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{width: '90%'}}></div></div>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-600">Tasks: 9/10</span>
                <span className="text-gray-600">Team: 3</span>
              </div>
              <div className="flex items-center mb-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">View Details →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
