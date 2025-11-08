'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TestingDash() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Week');
  const [selectedMetricRange, setSelectedMetricRange] = useState('This Week');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeProjects, setActiveProjects] = useState([
    {
      id: 1,
      name: 'Mobile App Redesign',
      status: 'On Track',
      statusColor: 'green',
      startDate: 'Dec 2, 2024',
      endDate: 'Dec 15, 2024',
      progress: 75,
      tasksCompleted: 12,
      tasksTotal: 16,
      teamSize: 5,
      teamAvatars: ['SA', 'JD', 'MK', 'LW', '+2']
    },
    {
      id: 2,
      name: 'Q4 Marketing Campaign',
      status: 'At Risk',
      statusColor: 'yellow',
      startDate: 'Oct 1, 2024',
      endDate: 'Oct 31, 2024',
      progress: 53,
      tasksCompleted: 8,
      tasksTotal: 15,
      teamSize: 7,
      teamAvatars: ['EM', 'RK', 'TJ', 'SC', '+3']
    },
    {
      id: 3,
      name: 'API Integration',
      status: 'On Track',
      statusColor: 'green',
      startDate: 'Jan 3, 2025',
      endDate: 'Feb 4, 2025',
      progress: 90,
      tasksCompleted: 9,
      tasksTotal: 10,
      teamSize: 3,
      teamAvatars: ['DL', 'KM', 'AS']
    }
  ]);

  const dailyBriefings = [
    {
      id: 1,
      type: 'attention',
      priority: 'High Priority',
      title: 'Attention Required',
      message: 'The Q4 Marketing Campaign is falling behind schedule. 3 critical tasks are overdue, and the current completion rate suggests a 2-week delay unless action is taken.',
      buttonText: 'Call Standup',
      buttonAction: 'View Details',
      bgColor: 'from-blue-500/10 to-blue-500/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 2,
      type: 'progress',
      priority: 'Positive Result',
      title: 'Great Progress',
      message: 'The Mobile App Redesign is ahead of schedule by 3 days. The development team has been highly productive this week with 85% task completion rate.',
      buttonText: 'Commends team',
      buttonAction: 'View Milestones',
      bgColor: 'from-green-500/10 to-green-500/5',
      borderColor: 'border-green-500/30',
      iconColor: 'bg-green-500/20 text-green-400'
    },
    {
      id: 3,
      type: 'suggestion',
      priority: 'Optimization',
      title: 'AI Suggestion',
      message: 'Based on team workload analysis, I recommend redistributing 2 tasks from Alex (100% capacity) to Emma (60% capacity) for better resource balance.',
      buttonText: 'Auto Redistribute',
      buttonAction: 'View Workload',
      bgColor: 'from-yellow-500/10 to-yellow-500/5',
      borderColor: 'border-yellow-500/30',
      iconColor: 'bg-yellow-500/20 text-yellow-400'
    },
    {
      id: 4,
      type: 'insight',
      priority: 'Helen Report',
      title: 'Performance Insight',
      message: 'Team velocity has increased by 23% this week. The new sprint planning approach is showing positive results across all active projects.',
      buttonText: 'View full report',
      buttonAction: 'Share with team',
      bgColor: 'from-purple-500/10 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'bg-purple-500/20 text-purple-400'
    }
  ];

  const workloadData = [
    { name: 'Alex', thisWeek: 120, lastWeek: 85, capacity: 100 },
    { name: 'Sarah', thisWeek: 95, lastWeek: 110, capacity: 100 },
    { name: 'David', thisWeek: 45, lastWeek: 50, capacity: 100 },
    { name: 'Emma', thisWeek: 75, lastWeek: 80, capacity: 100 },
    { name: 'Chris', thisWeek: 110, lastWeek: 95, capacity: 100 },
    { name: 'Lisa', thisWeek: 65, lastWeek: 70, capacity: 100 },
    { name: 'Mike', thisWeek: 85, lastWeek: 60, capacity: 100 },
    { name: 'Nina', thisWeek: 100, lastWeek: 105, capacity: 100 },
    { name: 'Oscar', thisWeek: 55, lastWeek: 45, capacity: 100 },
    { name: 'Paul', thisWeek: 80, lastWeek: 75, capacity: 100 },
    { name: 'Quinn', thisWeek: 70, lastWeek: 65, capacity: 100 },
    { name: 'Rita', thisWeek: 90, lastWeek: 100, capacity: 100 }
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      title: 'Mobile App Wireframes',
      project: 'Mobile App Redesign',
      dueDate: 'Today',
      dueDateFull: 'Expected by 5:00pm',
      priority: 'high',
      icon: '⚠️',
      iconBg: 'bg-red-500/20',
      avatar: 'SA',
      avatarColor: 'from-red-500 to-red-600'
    },
    {
      id: 2,
      title: 'Campaign Content Review',
      project: 'Q4 Marketing Campaign',
      dueDate: 'Tomorrow',
      dueDateFull: 'Nov 24, 2024',
      priority: 'medium',
      icon: '⭐',
      iconBg: 'bg-yellow-500/20',
      avatar: 'EM',
      avatarColor: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 3,
      title: 'API Documentation',
      project: 'API Integration',
      dueDate: 'Nov 28',
      dueDateFull: '3 days left',
      priority: 'normal',
      icon: '</>', 
      iconBg: 'bg-blue-500/20',
      avatar: 'DL',
      avatarColor: 'from-blue-500 to-blue-600'
    },
    {
      id: 4,
      title: 'Sprint Planning Session',
      project: 'Team Management',
      dueDate: 'Nov 29',
      dueDateFull: '4 days left',
      priority: 'normal',
      icon: '📅',
      iconBg: 'bg-gray-500/20',
      avatar: 'JD',
      avatarColor: 'from-gray-500 to-gray-600'
    }
  ];

  const recentActivity = [
    { user: 'John Smith', action: 'created new task', detail: '"User Interface Mockups" in Mobile App Redesign', time: '2 hours ago', avatar: 'JS' },
    { user: 'Feeta AI', action: 'suggested', detail: 'redistributing tasks to optimize team workload', time: '3 hours ago', avatar: '🤖' },
    { user: 'Emma Wilson', action: 'uploaded new files to', detail: '"Q4 Marketing Campaign"', time: '5 hours ago', avatar: 'EW' },
    { user: 'Mike Johnson', action: 'created new milestone', detail: '"API Testing Phase"', time: '6 hours ago', avatar: 'MJ' },
    { user: 'API Integration', action: 'project reached', detail: '90% completion milestone', time: '8 hours ago', avatar: '🎯' }
  ];

  const integrations = [
    { name: 'Slack', status: 'Connected', icon: '/Images/slack.png', statusColor: 'text-green-400', connectedSince: '2 days ago' },
    { name: 'Github', status: 'Connected', icon: '/Images/github.png', statusColor: 'text-green-400', connectedSince: '5 days ago' },
    { name: 'Figma', status: 'Connected', icon: '/Images/business.png', statusColor: 'text-green-400', connectedSince: '1 week ago' },
    { name: 'Google Drive', status: 'Dormant', icon: '/Images/google-calendar.png', statusColor: 'text-gray-500', connectedSince: '2 weeks ago' }
  ];

  useEffect(() => {
    checkAuth();
    updateGreeting();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('https://localhost:5000/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newProjectName })
      });

      if (response.ok) {
        setShowNewProjectModal(false);
        setNewProjectName('');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const getStatusBadgeColor = (color) => {
    switch (color) {
      case 'green':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#0a0a0a] border-r border-[#2A2A2A] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-purple-600 rounded-xl flex items-center justify-center">
              <Image src="/Images/F2.png" alt="Feeta AI" width={24} height={24} className="rounded-md" />
            </div>
            <span className="text-xl font-bold text-white">Feeta AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#4C3BCF] to-purple-600 text-white rounded-xl mb-2 font-medium shadow-lg shadow-[#4C3BCF]/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
            <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1C1C1C] rounded-xl mb-2 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Projects
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1C1C1C] rounded-xl mb-2 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Team
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1C1C1C] rounded-xl mb-2 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1C1C1C] rounded-xl mb-6 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          {/* AI Assistant Section */}
          <div className="bg-gradient-to-br from-[#4C3BCF]/20 to-[#4C3BCF]/5 border border-[#4C3BCF]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4C3BCF] to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <span className="font-bold text-white">AI Assistant</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Get instant insights and automate repetitive tasks with AI</p>
            <button className="w-full bg-gradient-to-r from-[#4C3BCF] to-purple-600 hover:from-[#4C3BCF]/90 hover:to-purple-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              Ask Feeta AI
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Stats</div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Active Projects</span>
              <span className="font-bold text-white">8</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Tasks Due Today</span>
              <span className="font-bold text-orange-400">3</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Team Members</span>
              <span className="font-bold text-white">15</span>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#0a0a0a] border-b border-[#2A2A2A] px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ask Feeta AI anything... (e.g., 'Create a new project for Q4 marketing campaign')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-[#1C1C1C] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4C3BCF] transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#4C3BCF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-6">
              <button className="relative p-2 hover:bg-[#1C1C1C] rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>

              <button className="p-2 hover:bg-[#1C1C1C] rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-purple-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'S'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-black">
          <div className="p-8">
            {/* Greeting Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {greeting}, {user?.email?.split('@')[0] || 'Sarah'}! 👋
              </h1>
              <p className="text-gray-400">Here's what's happening with your projects today</p>
            </div>

            {/* Command Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">Create Project</span>
                </div>
                <p className="text-sm text-gray-400">"Create a new project for recent app redesign"</p>
              </div>

              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">Assign Tasks</span>
                </div>
                <p className="text-sm text-gray-400">"Assign all marketing to team for next week"</p>
              </div>

              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">Generate Report</span>
                </div>
                <p className="text-sm text-gray-400">"Show me team productivity for last month"</p>
              </div>
            </div>

            {/* Active Projects */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Projects</h2>
                <button 
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#4C3BCF] to-purple-600 hover:from-[#4C3BCF]/90 hover:to-purple-600/90 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeProjects.map((project) => (
                  <div key={project.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-purple-600 rounded"></div>
                          <h3 className="font-bold text-white">{project.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{project.startDate} - {project.endDate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(project.statusColor)}`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold text-white">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#4C3BCF] to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm">
                        <span className="text-gray-400">Tasks:</span>
                        <span className="font-bold text-white ml-1">{project.tasksCompleted}/{project.tasksTotal}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Team:</span>
                        <span className="font-bold text-white ml-1">{project.teamSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.teamAvatars.map((avatar, idx) => (
                          <div key={idx} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-[#0a0a0a] rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {avatar}
                          </div>
                        ))}
                      </div>
                      <button className="text-[#4C3BCF] hover:text-[#4C3BCF]/80 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feeta's Daily Briefing */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-purple-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Feeta's Daily Briefing</h2>
                </div>
                <span className="text-sm text-gray-400">Updated 2 minutes ago</span>
              </div>

              <div className="space-y-4">
                {dailyBriefings.map((briefing) => (
                  <div key={briefing.id} className={`bg-gradient-to-br ${briefing.bgColor} border ${briefing.borderColor} rounded-xl p-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${briefing.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {briefing.type === 'attention' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {briefing.type === 'progress' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {briefing.type === 'suggestion' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {briefing.type === 'insight' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-white">{briefing.title}</h3>
                          <span className="text-xs text-gray-400">{briefing.priority}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-4">{briefing.message}</p>
                        <div className="flex items-center gap-3">
                          <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            briefing.type === 'attention' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                            briefing.type === 'progress' ? 'bg-green-600 text-white hover:bg-green-700' :
                            briefing.type === 'suggestion' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                            'bg-purple-600 text-white hover:bg-purple-700'
                          } transition-colors`}>
                            {briefing.buttonText}
                          </button>
                          <button className="text-gray-400 hover:text-white text-sm font-medium">
                            {briefing.buttonAction}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Team Workload Overview */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Team Workload Overview</h2>
                  <div className="flex items-center gap-2">
                    {['This Week', 'Next Week', 'This Month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedTimeRange(range)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedTimeRange === range
                            ? 'bg-[#4C3BCF] text-white'
                            : 'text-gray-400 hover:bg-[#1C1C1C]'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div className="h-64 mb-6">
                  <div className="flex items-end justify-between h-full border-b border-l border-gray-800 px-4">
                    {workloadData.map((member, idx) => {
                      const isOverloaded = member.thisWeek > member.capacity;
                      const height = Math.min((member.thisWeek / 120) * 100, 100);
                      
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-full flex flex-col items-center">
                            <span className="text-xs font-bold text-white mb-1">{member.thisWeek}%</span>
                            <div 
                              className={`w-12 rounded-t-lg transition-all duration-300 ${
                                isOverloaded ? 'bg-red-500' : 
                                member.thisWeek > 85 ? 'bg-yellow-500' : 
                                'bg-blue-500'
                              }`}
                              style={{ height: `${height}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 rotate-0">{member.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">85%</div>
                    <div className="text-sm text-gray-400">Avg. Capacity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">12</div>
                    <div className="text-sm text-gray-400">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">2</div>
                    <div className="text-sm text-gray-400">Overloaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">3</div>
                    <div className="text-sm text-gray-400">Available</div>
                  </div>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
                  <button className="text-[#4C3BCF] hover:text-[#4C3BCF]/80 text-sm font-medium">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-start gap-3 p-3 hover:bg-[#1C1C1C] rounded-lg transition-colors">
                      <div className={`w-10 h-10 ${deadline.iconBg} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                        {deadline.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-0.5">{deadline.title}</h4>
                        <p className="text-xs text-gray-400 mb-1">{deadline.project}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{deadline.dueDate}</span>
                          <span className="text-xs text-gray-500">• {deadline.dueDateFull}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 bg-gradient-to-br ${deadline.avatarColor} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                        {deadline.avatar}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all text-center group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-1">Create Project</h3>
                  <p className="text-xs text-gray-400">Start a new project with AI assistance</p>
                </button>

                <button className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all text-center group">
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-1">Invite Teammates</h3>
                  <p className="text-xs text-gray-400">Add team members to your workspace</p>
                </button>

                <button className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all text-center group">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-1">Connect Tools</h3>
                  <p className="text-xs text-gray-400">Integrate with your favorite apps</p>
                </button>

                <button className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-[#4C3BCF]/30 transition-all text-center group">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white mb-1">Generate Report</h3>
                  <p className="text-xs text-gray-400">Create custom analytics reports</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Performance Metrics */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
                  <div className="flex items-center gap-2">
                    {['This Week', 'Last Week', 'This Month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedMetricRange(range)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedMetricRange === range
                            ? 'bg-[#4C3BCF] text-white'
                            : 'text-gray-400 hover:bg-[#1C1C1C]'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-400 mb-1">87%</div>
                    <div className="text-sm text-blue-300 font-medium mb-2">Task Completion</div>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>+16% from last week</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-400 mb-1">4.2</div>
                    <div className="text-sm text-green-300 font-medium mb-2">Avg. Project Score</div>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>+0.5 from last week</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-3xl font-bold text-purple-400 mb-1">23</div>
                    <div className="text-sm text-purple-300 font-medium mb-2">AI Suggestions</div>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>+12 from last week</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-xl p-4">
                    <div className="text-3xl font-bold text-orange-400 mb-1">2.1h</div>
                    <div className="text-sm text-orange-300 font-medium mb-2">Avg. Response Time</div>
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>-30 mins from last week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                  <button className="text-[#4C3BCF] hover:text-[#4C3BCF]/80 text-sm font-medium">
                    View All Activity
                  </button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {activity.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{activity.user}</span> {activity.action} {activity.detail}
                        </p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <button className="text-gray-600 hover:text-gray-400 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Integration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {integrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#1C1C1C] rounded-xl hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-gray-800">
                        <Image src={integration.icon} alt={integration.name} width={24} height={24} className="object-contain" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{integration.name}</h4>
                        <p className={`text-xs ${integration.statusColor}`}>{integration.status}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Project</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#4C3BCF] transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 px-6 py-3 border border-gray-800 rounded-xl font-medium text-gray-400 hover:bg-[#1C1C1C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4C3BCF] to-purple-600 text-white rounded-xl font-medium hover:from-[#4C3BCF]/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
