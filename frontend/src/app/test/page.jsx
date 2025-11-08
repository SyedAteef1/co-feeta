'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SlackConnectButton from '@/components/SlackConnectButton';

export default function TestPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRepoModal, setShowRepoModal] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [sendingAll, setSendingAll] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [channelSummary, setChannelSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();

    // Check for connection success
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      alert('✅ GitHub connected successfully!');
      checkGithubConnection();
      window.history.replaceState({}, '', '/test');
    }
    if (params.get('slack_connected') === 'true') {
      alert('✅ Slack connected successfully!');
      // Clean URL and reload to refresh all connection statuses
      window.history.replaceState({}, '', '/test');
      window.location.reload();
    }
  }, []);

  const fetchChannels = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`https://localhost:5000/slack/api/list_conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.channels) {
          setChannels(data.channels);
        }
      } catch (err) {
        console.error("Error fetching channels:", err);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Fetch Slack channels on mount
    fetchChannels();
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchConversationHistory();
    }
  }, [sessionId]);

  const fetchConversationHistory = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`https://localhost:5000/api/conversation_history/${sessionId}`);
      const data = await res.json();
      setConversationHistory(data.conversations || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const checkGithubConnection = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://localhost:5000/github/api/check_connection', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('GitHub status response:', data);
      setGithubConnected(data.connected);
      if (data.connected) {
        fetchRepos();
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
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
        console.log('📂 Loaded projects from database:', data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
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
        await loadProjects(); // Reload projects from database
        setSelectedProject(data.project);
        setMessages([]);
        setSessionId(null);
      } else {
        alert('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
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
        await loadProjects(); // Reload projects from database
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

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const connectGithub = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first");
      return;
    }
    window.location.href = `https://localhost:5000/github/install?token=${token}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedProject?.repo) {
      alert("Please select a project and connect a repository first");
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
        aiResponse.originalTask = input; // Store the original task
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

  const submitAnswers = async (messageIndex, answers) => {
    const message = messages[messageIndex];
    setIsLoading(true);

    console.log("📝 Submitting answers for message:", message);
    console.log("💬 Answers:", answers);

    // Find the original user message (task) before the questions
    let originalTask = message.originalTask || '';
    
    if (!originalTask) {
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          originalTask = messages[i].content;
          break;
        }
      }
    }

    console.log("🎯 Original task:", originalTask);

    if (!originalTask) {
      alert("Error: Could not find the original task. Please try again.");
      setIsLoading(false);
      return;
    }

    // Convert answers object to the format expected by backend
    const formattedAnswers = {};
    Object.keys(answers).forEach(key => {
      const questionIndex = parseInt(key.replace('q', ''));
      formattedAnswers[`q${questionIndex}`] = answers[key];
    });

    try {
      const requestBody = {
        task: originalTask,
        session_id: sessionId,
        answers: formattedAnswers
      };

      console.log("📡 Sending to /api/generate_plan:", requestBody);

      const planRes = await fetch("https://localhost:5000/api/generate_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("✅ Response status:", planRes.status);
      const planData = await planRes.json();
      console.log("📦 Plan data received:", planData);
      
      if (planRes.ok && !planData.error) {
        const aiResponse = {
          role: 'assistant',
          content: `Thank you for the clarifications! I've created a detailed plan with ${planData.subtasks?.length} subtasks.`,
          timestamp: new Date().toISOString(),
          plan: planData
        };

        console.log("✨ Adding AI response to messages:", aiResponse);

        const updatedMessages = [...messages, aiResponse];
        setMessages(updatedMessages);

        // Save plan to database
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
                data: { plan: planData }
              })
            });
            console.log("💾 Plan saved to database");
          } catch (error) {
            console.error("Error saving plan:", error);
          }
        }
      } else {
        console.error("❌ Error from API:", planData.error);
        alert(`Error: ${planData.error}`);
      }
    } catch (error) {
      console.error("❌ Error submitting answers:", error);
      alert(`Error submitting answers: ${error.message}`);
    }

    setIsLoading(false);
  };

  const fetchChannelSummary = async (channelId) => {
    const token = localStorage.getItem('token');
    if (!token || !channelId) return;

    setLoadingSummary(true);

    try {
      const historyRes = await fetch(`https://localhost:5000/slack/api/channel_history?channel=${channelId}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!historyRes.ok) throw new Error('Failed to fetch channel history');

      const historyData = await historyRes.json();
      const messages = historyData.messages || [];

      if (messages.length === 0) {
        setChannelSummary({
          overall_status: "No recent messages in this channel",
          key_updates: [],
          active_users: [],
          blockers: [],
          progress_indicators: [],
          action_items: [],
          sentiment: "neutral"
        });
        return;
      }

      const summaryRes = await fetch(`https://localhost:5000/slack/api/summarize_channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
      });

      if (!summaryRes.ok) throw new Error('Failed to generate summary');

      const summaryData = await summaryRes.json();
      setChannelSummary(summaryData.summary);
      setShowSummary(true);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setChannelSummary({ overall_status: "Error loading summary", error: error.message });
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (showSummary && selectedChannel) {
      const interval = setInterval(() => {
        fetchChannelSummary(selectedChannel);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [showSummary, selectedChannel]);

  const assignAllToSlack = async (plan) => {
    if (!selectedChannel || !plan || !plan.subtasks) return;
    
    setSendingAll(true);
    const token = localStorage.getItem('token');
    const originalPrompt = conversationHistory[conversationHistory.length - 1]?.prompt || "Task";
    
    try {
      const summaryMessage = `🚀 *New Task Breakdown*\n\n*Original Prompt:* ${originalPrompt}\n\n*Main Goal:* ${plan.goal}\n*Total Subtasks:* ${plan.subtasks.length}\n\n---\n`;
      
      await fetch("https://localhost:5000/slack/api/send_message", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          channel: selectedChannel,
          text: summaryMessage,
        }),
      });
      
      for (let i = 0; i < plan.subtasks.length; i++) {
        const subtask = plan.subtasks[i];
        const message = `📝 *Task ${i + 1}/${plan.subtasks.length}: ${subtask.title}*\n\n*Description:* ${subtask.description}\n*Assigned to:* ${subtask.assigned_to}\n*Deadline:* ${subtask.deadline}\n*Expected Output:* ${subtask.output}\n*Clarity Score:* ${subtask.clarity_score}%`;
        
        await fetch("https://localhost:5000/slack/api/send_message", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            channel: selectedChannel,
            text: message,
          }),
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      alert(`✅ All ${plan.subtasks.length} tasks sent to Slack!`);
      
      setTimeout(() => {
        fetchChannelSummary(selectedChannel);
      }, 2000);
    } catch (err) {
      console.error("Error sending to Slack:", err);
      alert(`❌ Error sending tasks: ${err.message}`);
    }
    
    setSendingAll(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSessionId(null);
    
    // Load messages from database
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
        
        // Normalize message structure (database stores data.plan, UI expects plan)
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
        console.error('Failed to load messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-60' : 'w-0'} transition-all duration-300 bg-[#111111] flex flex-col border-r border-[#1a1a1a] overflow-hidden`}>
        <div className="flex items-center gap-2 px-5 py-6 border-b border-[#1a1a1a]">
          <Image src="/Images/F2.png" alt="Logo" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-base">Feeta AI</span>
          <button className="ml-auto text-gray-500 hover:text-gray-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 space-y-1">

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>New Project</span>
          </button>
        </div>

        <div className="h-px bg-[#1a1a1a] mx-4 my-2"></div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="text-xs text-gray-500 px-3 pb-2">Your Projects</div>
          {projects.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => selectProject(project)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedProject?.id === project.id ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="truncate font-medium">{project.name}</div>
                {project.repo && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {project.repo.name}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[#1a1a1a] p-4 space-y-1">
            <button
              onClick={() => router.push('/slack-monitor')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Slack Monitor</span>
            </button>

            {!githubConnected && (
              <button
                onClick={connectGithub}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Connect GitHub</span>
              </button>
            )}
          
          {githubConnected && (
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-green-400">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub Connected</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <SlackConnectButton />
        </div>

          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">Pro</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="4" r="1" fill="currentColor"/>
                <circle cx="8" cy="8" r="1" fill="currentColor"/>
                <circle cx="8" cy="12" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
          </div>
        </div>

        {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <h1 className="text-lg font-medium">
              {selectedProject ? selectedProject.name : 'Dashboard'}
            </h1>
          </div>
          
          {selectedProject && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Last update 12min ago</span>
              {selectedProject.repo ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>{selectedProject.repo.full_name}</span>
                  <button
                    onClick={() => setShowRepoModal(true)}
                    className="text-blue-400 hover:text-blue-300 ml-2"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRepoModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                >
                  Connect Repository
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedProject ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <h1 className="text-4xl font-semibold mb-4">Welcome to Feeta AI</h1>
              <p className="text-gray-500 text-center mb-8 max-w-md">
                Create a project to start chatting with AI about your tasks
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Create Your First Project
              </button>
              </div>
          ) : !selectedProject.repo ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="max-w-2xl w-full">
                <h2 className="text-3xl font-semibold mb-4 text-center">Connect a Repository</h2>
                <p className="text-gray-500 text-center mb-8">
                  Connect a GitHub repository to provide context for AI task analysis
                </p>
                
                {repos.length === 0 ? (
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">No repositories found. Please connect GitHub first.</p>
                    {!githubConnected && (
                      <button
                        onClick={connectGithub}
                        className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-medium"
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
                        className="p-4 bg-[#111111] border border-[#1a1a1a] rounded-lg hover:border-[#2a2a2a] transition-colors text-left"
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
          ) : messages.length === 0 ? (
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
                    className="p-5 rounded-lg border border-[#1a1a1a] bg-[#111111] hover:border-[#2a2a2a] transition-colors text-left"
                  >
                    <div className="text-sm font-semibold mb-1">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </button>
                ))}
              </div>
                </div>
              ) : (
            <div className="max-w-4xl mx-auto py-8 px-4">
              {messages.map((msg, i) => (
                <MessageComponent
                  key={i}
                  message={msg}
                  index={i}
                  onSubmitAnswers={submitAnswers}
                  onAssignAll={assignAllToSlack}
                  channels={channels}
                  selectedChannel={selectedChannel}
                  setSelectedChannel={setSelectedChannel}
                  sendingAll={sendingAll}
                  userName={user?.name}
                  showSummary={showSummary}
                  setShowSummary={setShowSummary}
                  channelSummary={channelSummary}
                  loadingSummary={loadingSummary}
                  fetchChannelSummary={fetchChannelSummary}
                />
              ))}
              {isLoading && (
                <div className="bg-[#111111] -mx-4 px-4 py-6">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">Analyzing your task...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {selectedProject?.repo && (
          <div className="border-t border-[#1a1a1a] p-4 bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#111111] rounded-lg border border-[#1a1a1a]">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Describe what you want to build..."
                  className="w-full bg-transparent px-4 py-3 focus:outline-none resize-none text-white placeholder-gray-600"
                  rows={1}
                  style={{ minHeight: '24px', maxHeight: '200px' }}
                />
                <div className="px-3 pb-3 flex items-center justify-end">
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-center text-xs text-gray-600 mt-3">
                Feeta AI can make mistakes. Check important info.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
              placeholder="Project name"
              autoFocus
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-[#2a2a2a]"
            />
            <div className="flex gap-2">
              <button
                onClick={createProject}
                className="flex-1 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-lg hover:bg-[#222222] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-4">
              {selectedProject?.repo ? 'Change Repository' : 'Select Repository'}
            </h3>
            
            {repos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No repositories found.</p>
                {!githubConnected && (
                  <button
                    onClick={connectGithub}
                    className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Connect GitHub
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 mb-4">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => connectRepoToProject(repo)}
                      className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#2a2a2a] transition-colors text-left"
                    >
                      <div className="font-medium text-sm mb-1">{repo.name}</div>
                      <div className="text-xs text-gray-400">{repo.language || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">{repo.full_name}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowRepoModal(false)}
                  className="w-full bg-[#1a1a1a] px-4 py-2 rounded-lg hover:bg-[#222222] transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Message Component
function MessageComponent({ message, index, onSubmitAnswers, onAssignAll, channels, selectedChannel, setSelectedChannel, sendingAll, userName, showSummary, setShowSummary, channelSummary, loadingSummary, fetchChannelSummary }) {
  const [answers, setAnswers] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [localSelectedChannel, setLocalSelectedChannel] = useState(selectedChannel);

  return (
    <div className={`mb-8 ${message.role === 'user' ? '' : 'bg-[#111111] -mx-4 px-4 py-6'}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
          }`}>
            {message.role === 'user' ? (
              <span className="text-sm font-bold">{userName?.charAt(0) || 'U'}</span>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Questions */}
            {message.questions && message.questions.length > 0 && (
              <div className="space-y-3 mt-4">
                {message.questions.map((q, qi) => {
                  const questionText = typeof q === 'string' ? q : q.question;
                  const explanation = typeof q === 'object' ? q.explanation : null;
                  return (
                    <div key={qi} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm font-semibold flex-1">{questionText}</span>
                        {explanation && (
                          <button
                            onMouseEnter={() => setActiveTooltip(qi)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            className="text-xs text-gray-400 hover:text-gray-300 relative"
                          >
                            ℹ️
                            {activeTooltip === qi && (
                              <div className="absolute right-0 top-6 z-10 w-64 bg-gray-800 border border-purple-500 rounded-lg p-3 shadow-xl text-left">
                                <div className="text-xs text-gray-300">{explanation}</div>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Your answer..."
                        onChange={(e) => setAnswers({ ...answers, [`q${qi}`]: e.target.value })}
                        className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2a2a2a]"
                      />
                    </div>
                  );
                })}
                <button
                  onClick={() => onSubmitAnswers(index, answers)}
                  className="w-full px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Submit Answers & Generate Plan
                </button>
              </div>
            )}

            {/* Plan */}
            {message.plan && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 mt-4">
                <h3 className="text-lg font-semibold mb-2">{message.plan.main_task}</h3>
                <p className="text-sm text-gray-400 mb-4">{message.plan.goal}</p>
                <div className="space-y-3 mb-6">
                  {message.plan.subtasks?.map((subtask, si) => (
                    <div key={si} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
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

                {/* Global Assignment */}
                <div className="pt-4 border-t border-[#1a1a1a]">
                  <h5 className="font-semibold mb-3 text-purple-400">🚀 Assign All to Slack</h5>
                  <div className="flex gap-3">
                    <select
                      value={localSelectedChannel}
                      onChange={(e) => {
                        setLocalSelectedChannel(e.target.value);
                        setSelectedChannel(e.target.value);
                      }}
                      className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2a2a2a]"
                    >
                      <option value="">-- Select Channel --</option>
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.is_channel ? '#' : ''}{ch.name || 'DM'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onAssignAll(message.plan)}
                      disabled={!localSelectedChannel || sendingAll}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-lg whitespace-nowrap font-medium transition-colors"
                    >
                      {sendingAll ? "Sending..." : `Send ${message.plan.subtasks?.length} Tasks`}
                    </button>
                  </div>
                </div>

                {/* Channel Summary Section */}
                {showSummary && channelSummary && localSelectedChannel && (
                  <div className="mt-6 p-4 bg-[#343541] border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-purple-400 flex items-center gap-2">
                        📊 Channel Activity Summary
                        {loadingSummary && <span className="text-xs text-gray-400">(Updating...)</span>}
                      </h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchChannelSummary(localSelectedChannel)}
                          disabled={loadingSummary}
                          className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50"
                        >
                          🔄 Refresh
                        </button>
                        <button
                          onClick={() => setShowSummary(false)}
                          className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Overall Status */}
                      <div className="p-3 bg-[#40414F] rounded-lg">
                        <div className="text-sm font-medium text-purple-300 mb-1">📌 Status</div>
                        <div className="text-sm text-gray-300">{channelSummary.overall_status}</div>
                        {channelSummary.sentiment && (
                          <div className="mt-2 text-xs">
                            Sentiment: <span className={`font-medium ${
                              channelSummary.sentiment === 'positive' ? 'text-green-400' :
                              channelSummary.sentiment === 'negative' ? 'text-red-400' :
                              'text-gray-400'
                            }`}>{channelSummary.sentiment}</span>
                          </div>
                        )}
                      </div>

                      {/* Key Updates */}
                      {channelSummary.key_updates && channelSummary.key_updates.length > 0 && (
                        <div className="p-3 bg-[#40414F] rounded-lg">
                          <div className="text-sm font-medium text-purple-300 mb-2">💬 Key Updates</div>
                          <div className="space-y-1">
                            {channelSummary.key_updates.map((update, idx) => (
                              <div key={idx} className="text-xs text-gray-300">
                                <span className="font-medium text-purple-200">{update.user}:</span> {update.update}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active Users */}
                      {channelSummary.active_users && channelSummary.active_users.length > 0 && (
                        <div className="p-3 bg-[#40414F] rounded-lg">
                          <div className="text-sm font-medium text-purple-300 mb-2">👥 Active ({channelSummary.active_users.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {channelSummary.active_users.map((user, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-200 rounded">
                                {user}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress & Blockers */}
                      {channelSummary.progress_indicators && channelSummary.progress_indicators.length > 0 && (
                        <div className="p-3 bg-[#40414F] rounded-lg">
                          <div className="text-sm font-medium text-green-400 mb-2">✅ Progress</div>
                          <ul className="space-y-1">
                            {channelSummary.progress_indicators.map((progress, idx) => (
                              <li key={idx} className="text-xs text-gray-300">• {progress}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {channelSummary.blockers && channelSummary.blockers.length > 0 && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <div className="text-sm font-medium text-red-400 mb-2">🚫 Blockers</div>
                          <ul className="space-y-1">
                            {channelSummary.blockers.map((blocker, idx) => (
                              <li key={idx} className="text-xs text-red-300">⚠️ {blocker}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 text-center pt-2">
                        Auto-refreshing every 30s • Last 50 messages
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
