'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashPage() {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedNav, setSelectedNav] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('team'); // 'team' or 'chat'
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [showRepoModal, setShowRepoModal] = useState(false);

  const tasks = {
    todo: [
      {
        id: 1,
        title: 'New Task',
        description: 'Involves creating and assigning a new task within the project management system. The...',
        dueDate: null,
        priority: null,
        assignees: [],
      }
    ],
    inProgress: [
      {
        id: 2,
        title: 'Planning meeting for second option of the dashboard',
        description: 'Focus on strategizing and outlining the development of the second option for the dashb...',
        dueDate: 'Sep 09, 2024',
        priority: 'Medium',
        assignees: ['/Images/F.png', '/Images/F1.png'],
        attachments: 2,
        comments: 7,
      },
      {
        id: 3,
        title: 'Finish the ideation',
        description: 'The team will conclude the ideation phase by finalizing and refining concepts that have been d...',
        dueDate: 'Sep 12, 2024',
        priority: 'High',
        assignees: ['/Images/F.png', '/Images/F1.png'],
        progress: 68,
        attachments: 12,
        comments: 34,
      },
      {
        id: 4,
        title: 'Preparation low - fidelity for mobile',
        description: 'Involves creating low-fidelity wireframes specifically for the mobile version of the project...',
        dueDate: 'Sep 15, 2024',
        priority: 'Low',
        assignees: ['/Images/F.png', '/Images/F1.png', '/Images/F2.png'],
        progress: 0,
      }
    ],
    inReview: [
      {
        id: 5,
        title: 'Business model canvas of product',
        description: 'Developing a comprehensive Business Model Canvas for the product, outlining the key com...',
        dueDate: 'Sep 01, 2024',
        priority: 'Low',
        assignees: ['/Images/F.png', '/Images/F1.png', '/Images/F2.png'],
        progress: 50,
        attachments: 1,
      }
    ]
  };

  const teamMembers = [
    { id: 1, avatar: '/Images/F.png' },
    { id: 2, avatar: '/Images/F1.png' },
    { id: 3, avatar: '/Images/F2.png' },
    { id: 4, avatar: '/Images/F.png' },
    { id: 5, avatar: '/Images/F1.png' },
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-900/30 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'Low': return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  useEffect(() => {
    checkAuth();
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
      
      if (!response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      const data = await response.json();
      setUser(data.user);
      setGithubConnected(data.user.github_connected || false);
      loadProjects();
      if (data.user.github_connected) {
        fetchRepos();
      }
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('https://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        console.log('📂 Loaded projects:', data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('https://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          repo: null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Project created:', data.project);
        setNewProjectName('');
        setShowCreateModal(false);
        await loadProjects();
        setSelectedProject(data.project);
      } else {
        alert('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const fetchRepos = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://localhost:5000/github/api/repos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
    }
  };

  const connectRepoToProject = async (repo) => {
    const token = localStorage.getItem('token');
    if (!token || !selectedProject) return;
    
    try {
      const projectId = selectedProject._id || selectedProject.id;
      const response = await fetch(`https://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repo })
      });
      
      if (response.ok) {
        console.log('✅ Repo connected to project');
        await loadProjects();
        setSelectedProject({ ...selectedProject, repo });
        setShowRepoModal(false);
      } else {
        alert('Failed to connect repository');
      }
    } catch (error) {
      console.error('Error connecting repo:', error);
      alert('Error connecting repository');
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSessionId(null);
    
    // Load messages from database if in chat mode
    if (viewMode === 'chat') {
      const token = localStorage.getItem('token');
      if (!token || !project._id) {
        setMessages([]);
        return;
      }
      
      try {
        const projectId = project._id || project.id;
        const response = await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Loaded messages from database:', data.messages);
          
          const normalizedMessages = (data.messages || []).map(msg => {
            if (msg.data?.plan && !msg.plan) {
              return { ...msg, plan: msg.data.plan };
            }
            if (msg.data?.questions && !msg.questions) {
              return { ...msg, questions: msg.data.questions };
            }
            return msg;
          });
          
          setMessages(normalizedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedProject?.repo) {
      alert("Please connect a repository to this project first");
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Save user message to database
    if (selectedProject) {
      const token = localStorage.getItem('token');
      const projectId = selectedProject._id || selectedProject.id;
      
      try {
        await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: 'user',
            content: input
          })
        });
        console.log("💾 User message saved to database");
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    try {
      const [owner, repoName] = selectedProject.repo?.full_name?.split('/') || [];

      const res = await fetch("https://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input,
          session_id: sessionId,
          owner,
          repo: repoName,
          github_token: user?.github_token
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed");
      }

      setSessionId(data.session_id);

      let aiResponse = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        data: data
      };

      if (data.status === "clear" || data.status === "needs_context") {
        const planRes = await fetch("https://localhost:5000/api/generate_plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: input,
            session_id: data.session_id,
            answers: {}
          }),
        });

        const planData = await planRes.json();
        
        if (planRes.ok && !planData.error) {
          aiResponse.content = `I've analyzed your request: "${input}"\n\nI've created an implementation plan with ${planData.subtasks?.length} subtasks.`;
          aiResponse.plan = planData;
        }
      } else if (data.status === "ambiguous") {
        aiResponse.content = "I need some clarification before proceeding:";
        aiResponse.questions = data.questions;
        aiResponse.needsAnswers = true;
        aiResponse.originalTask = input;
      }

      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);

      // Save AI response to database
      if (selectedProject) {
        const token = localStorage.getItem('token');
        const projectId = selectedProject._id || selectedProject.id;
        
        try {
          await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              role: 'assistant',
              content: aiResponse.content,
              data: aiResponse.plan ? { plan: aiResponse.plan } : { questions: aiResponse.questions }
            })
          });
          console.log("💾 AI response saved to database");
          await loadProjects(); // Refresh to update message count
        } catch (error) {
          console.error("Error saving AI response:", error);
        }
      }

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages([...newMessages, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#1C1C1C] text-white overflow-hidden">
      {/* Icon Navigation Sidebar */}
      <div className="w-16 bg-[#141414] border-r border-[#2A2A2A] flex flex-col items-center py-4 gap-2">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
          <Image src="/Images/F2.png" alt="Logo" width={28} height={28} className="rounded-lg" />
        </div>

        <button 
          onClick={() => setSelectedNav('grid')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'grid' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('projects')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'projects' ? 'bg-[#2A2A2A] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('time')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'time' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('chat')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'chat' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('archive')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'archive' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('bell')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'bell' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={() => setSelectedNav('settings')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'settings' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button 
          onClick={() => setSelectedNav('help')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedNav === 'help' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        <div className="w-full h-px bg-[#2A2A2A] my-2"></div>

        {/* Login/Logout Section */}
        {user ? (
          <>
            {/* User Avatar */}
            <button 
              onClick={() => setSelectedNav('profile')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                selectedNav === 'profile' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1C1C1C]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-[#1C1C1C] transition-all"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        ) : (
          /* Login Button */
          <button 
            onClick={() => router.push('/login')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-[#1C1C1C] transition-all"
            title="Login"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>

      {/* Projects Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#171717] border-r border-[#2A2A2A] overflow-hidden flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2A2A2A]">
          {/* Team/Chat Toggle */}
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setViewMode('team')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'team' 
                  ? 'bg-[#2A2A2A] text-white' 
                  : 'text-gray-400 hover:bg-[#202020]'
              }`}
            >
              Team
            </button>
            <button 
              onClick={() => setViewMode('chat')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'chat' 
                  ? 'bg-[#2A2A2A] text-white' 
                  : 'text-gray-400 hover:bg-[#202020]'
              }`}
            >
              Chat
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm pl-8 focus:outline-none focus:border-[#3A3A3A] transition-colors"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="absolute right-2.5 top-2 text-xs text-gray-600 bg-[#2A2A2A] px-1.5 py-0.5 rounded border border-[#3A3A3A]">⌘ S</kbd>
          </div>

          {/* New Projects Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-all text-sm font-semibold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Projects
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            {/* All Projects Label (non-clickable) */}
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-semibold">All Projects</span>
              </div>
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-500 text-center">
                  No projects yet. Create one to get started!
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project._id || project.id}
                    onClick={() => selectProject(project)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      selectedProject?._id === project._id || selectedProject?.id === project.id
                        ? 'bg-[#2A2A2A] text-white border border-[#3A3A3A]' 
                        : 'text-gray-400 hover:bg-[#202020] hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm">{project.name}</span>
                      </div>
                      <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold min-w-[24px] text-center">
                        {project.messages?.length || 0}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-[#2A2A2A] flex items-center justify-between px-6 bg-[#171717]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">Projects</span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h1 className="text-lg font-semibold">{selectedProject ? selectedProject.name : 'All Projects'}</h1>
              {selectedProject && (
                <button className="p-1.5 hover:bg-[#2A2A2A] rounded-lg transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Last update on Sep 12, 2024 - 09:45 AM</span>
            
            {/* Team Avatars */}
            <div className="flex items-center -space-x-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-purple-600">
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                </div>
              ))}
              <button className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] bg-gray-800 flex items-center justify-center text-xs hover:bg-gray-700 transition-colors">
                +3
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] rounded-lg transition-all text-sm flex items-center gap-2 border border-[#3A3A3A]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Board
              </button>
              <button className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all text-sm font-semibold flex items-center gap-2 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invite Member
              </button>
              <button className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Private Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2A2A] rounded-lg border border-[#3A3A3A]">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-gray-300">Private</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-10 h-5 bg-[#3A3A3A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content Area - Team or Chat View */}
        {viewMode === 'team' ? (
          /* Kanban Board */
          <div className="flex-1 overflow-x-auto overflow-y-auto bg-[#1C1C1C] p-6">
          <div className="flex gap-6 h-full min-w-max">
            {/* To Do Column */}
            <div className="w-80 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">To Do</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {/* Add New Task Card */}
                <button className="w-full border-2 border-dashed border-[#3A3A3A] rounded-2xl p-6 hover:border-[#4A4A4A] hover:bg-[#202020] transition-all min-h-[200px] flex flex-col items-center justify-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-[#2A2A2A] group-hover:bg-[#333333] flex items-center justify-center transition-all">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm mb-1 text-gray-300">Add New Task</div>
                    <div className="text-xs text-gray-500">Click to create a new task</div>
                  </div>
                </button>

                {tasks.todo.map((task) => (
                  <div key={task.id} className="bg-[#252525] rounded-2xl p-4 border border-[#3A3A3A] hover:border-[#4A4A4A] hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <button className="p-1 hover:bg-[#3A3A3A] rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="w-80 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">In Progress</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {tasks.inProgress.map((task) => (
                  <div key={task.id} className="bg-[#252525] rounded-2xl p-4 border border-[#3A3A3A] hover:border-[#4A4A4A] hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {task.dueDate}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-[#3A3A3A] rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>

                    <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>

                    {task.progress !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{task.progress}%</span>
                        </div>
                        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2">
                        {task.assignees.map((avatar, idx) => (
                          <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#252525] overflow-hidden bg-purple-600 hover:scale-110 transition-transform">
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {task.attachments && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="font-medium">{task.attachments}</span>
                          </div>
                        )}
                        {task.comments && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="font-medium">{task.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Review Column */}
            <div className="w-80 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">In Review</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-[#2A2A2A] rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {tasks.inReview.map((task) => (
                  <div key={task.id} className="bg-[#252525] rounded-2xl p-4 border border-[#3A3A3A] hover:border-[#4A4A4A] hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {task.dueDate}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-[#3A3A3A] rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>

                    <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>

                    {task.progress !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{task.progress}%</span>
                        </div>
                        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2">
                        {task.assignees.map((avatar, idx) => (
                          <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#252525] overflow-hidden bg-purple-600 hover:scale-110 transition-transform">
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {task.attachments && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="font-medium">{task.attachments}</span>
                          </div>
                        )}
                        {task.comments && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="font-medium">{task.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* Chat View */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1C1C1C]">
            {!selectedProject ? (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <h1 className="text-4xl font-semibold mb-4">Select a Project</h1>
                <p className="text-gray-400 text-center mb-8 max-w-md">
                  Choose a project from the sidebar to start chatting with AI about your tasks
                </p>
              </div>
            ) : !selectedProject.repo ? (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div className="max-w-2xl w-full">
                  <h2 className="text-3xl font-semibold mb-4 text-center">Connect a Repository</h2>
                  <p className="text-gray-400 text-center mb-8">
                    Connect a GitHub repository to provide context for AI task analysis
                  </p>
                  
                  {repos.length === 0 ? (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">No repositories found. Please connect GitHub first.</p>
                      {!githubConnected && (
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            window.location.href = `https://localhost:5000/github/install?token=${token}`;
                          }}
                          className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#333333] rounded-lg transition-colors"
                        >
                          Connect GitHub
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                      {repos.map((repo) => (
                        <button
                          key={repo.id}
                          onClick={() => connectRepoToProject(repo)}
                          className="p-4 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg hover:border-purple-500 transition-colors text-left"
                        >
                          <div className="font-medium text-sm mb-1">{repo.name}</div>
                          <div className="text-xs text-gray-400">{repo.language || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">{repo.full_name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-4">
                      <h1 className="text-4xl font-semibold mb-8">What would you like to build?</h1>
                      <div className="w-full max-w-3xl grid grid-cols-2 gap-4">
                        {[
                          { title: "Dashboard", desc: "Create analytics dashboard", prompt: "Build a complete dashboard with analytics and charts" },
                          { title: "Authentication", desc: "Implement user auth", prompt: "Add user authentication system with login and signup" },
                          { title: "API", desc: "Build backend APIs", prompt: "Create REST API endpoints for CRUD operations" },
                          { title: "Database", desc: "Configure data layer", prompt: "Setup database schema and migrations" }
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(item.prompt)}
                            className="p-4 rounded-xl border border-[#3A3A3A] hover:bg-[#2A2A2A] transition-colors text-left"
                          >
                            <div className="text-sm font-semibold mb-1">{item.title}</div>
                            <div className="text-xs text-gray-400">{item.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto py-8 px-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={`mb-8 ${msg.role === 'user' ? '' : 'bg-[#2A2A2A] -mx-4 px-4 py-6'}`}>
                          <div className="max-w-3xl mx-auto">
                            <div className="flex gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' ? 'bg-purple-600' : 'bg-[#10A37F]'
                              }`}>
                                {msg.role === 'user' ? (
                                  <span className="text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                                  {msg.content}
                                </div>
                                
                                {msg.plan && (
                                  <div className="bg-[#343541] rounded-xl p-6 mt-4">
                                    <h3 className="text-lg font-semibold mb-2">{msg.plan.main_task}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{msg.plan.goal}</p>
                                    <div className="space-y-3">
                                      {msg.plan.subtasks?.map((subtask, si) => (
                                        <div key={si} className="bg-[#40414F] rounded-lg p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-sm">{si + 1}. {subtask.title}</div>
                                            <span className="text-xs text-green-400">{subtask.deadline}</span>
                                          </div>
                                          <p className="text-xs text-gray-400 mb-2">{subtask.description}</p>
                                          <div className="flex gap-3 text-xs text-gray-500">
                                            <span>👤 {subtask.assigned_to}</span>
                                            <span>📦 {subtask.output}</span>
                                            <span>✅ {subtask.clarity_score}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="bg-[#2A2A2A] -mx-4 px-4 py-6">
                          <div className="max-w-3xl mx-auto flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center">
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                            <div className="flex-1">Analyzing your task...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-[#2A2A2A] p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] shadow-lg">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Describe what you want to build..."
                        className="w-full bg-transparent px-4 py-3 focus:outline-none resize-none text-white placeholder-gray-500"
                        rows={1}
                        style={{ minHeight: '24px', maxHeight: '200px' }}
                      />
                      <div className="px-3 pb-3 flex items-center justify-end">
                        <button
                          onClick={sendMessage}
                          disabled={!input.trim() || isLoading}
                          className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-3">
                      Feeta AI can make mistakes. Check important info.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
              placeholder="Project name"
              autoFocus
              className="w-full bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-[#4A4A4A] transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={createProject}
                className="flex-1 bg-white text-black px-4 py-2.5 rounded-lg hover:bg-gray-100 font-semibold transition-all"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 bg-[#3A3A3A] px-4 py-2.5 rounded-lg hover:bg-[#4A4A4A] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

