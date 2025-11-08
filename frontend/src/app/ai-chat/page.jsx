"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SlackConnectButton from "@/components/SlackConnectButton";

export default function AIChatInterface() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [repos, setRepos] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [sendingAll, setSendingAll] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      checkGithubConnection();
      window.history.replaceState({}, '', '/ai-chat');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Fetch Slack channels
    const fetchChannels = async () => {
      const slackUserId = localStorage.getItem('slack_user_id');
      if (slackUserId) {
        try {
          const res = await fetch(`https://localhost:5000/api/list_conversations?user_id=${slackUserId}`);
          const data = await res.json();
          if (data.channels) {
            setChannels(data.channels);
          }
        } catch (err) {
          console.error("Error fetching channels:", err);
        }
      }
    };
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
      const response = await fetch('https://localhost:5000/api/github/check_connection', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setGithubConnected(data.connected);
      if (data.connected) {
        fetchRepos();
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    }
  };

  const loadProjects = () => {
    const saved = localStorage.getItem('projects');
    if (saved) setProjects(JSON.parse(saved));
  };

  const saveProjects = (updatedProjects) => {
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
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

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newProject = {
      id: Date.now(),
      name: newProjectName,
      repo: null,
      tasks: [],
      createdAt: new Date().toISOString()
    };
    const updated = [newProject, ...projects];
    saveProjects(updated);
    setNewProjectName('');
    setShowProjectModal(false);
    setSelectedProject(newProject);
  };

  const connectRepoToProject = (repo) => {
    const updated = projects.map(p => 
      p.id === selectedProject.id ? { ...p, repo } : p
    );
    saveProjects(updated);
    setSelectedProject({ ...selectedProject, repo });
    setShowRepoSelector(false);
  };

  const connectGithub = () => {
    const token = localStorage.getItem('token');
    window.location.href = `https://localhost:5000/github/install?token=${token}`;
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const createNewChat = () => {
    const newConv = {
      id: Date.now().toString(),
      title: "New Chat",
      timestamp: new Date().toISOString(),
      messages: []
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setCurrentConversation(newConv);
    setMessages([]);
    setSessionId(null);
    saveConversations(updated);
  };

  const saveConversations = (convs) => {
    if (selectedProject) {
      const updated = projects.map(p =>
        p.id === selectedProject.id ? { ...p, conversations: convs } : p
      );
      saveProjects(updated);
    }
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

    try {
      const [owner, repoName] = selectedProject.repo?.full_name?.split('/') || [];

      // Call analyze endpoint
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
        // Generate plan automatically
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
      }

      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);

      // Update conversation
      if (currentConversation) {
        const updatedConv = {
          ...currentConversation,
          title: messages.length === 0 ? input.substring(0, 50) : currentConversation.title,
          messages: updatedMessages
        };
        const updatedConvs = conversations.map(c => 
          c.id === currentConversation.id ? updatedConv : c
        );
        setConversations(updatedConvs);
        setCurrentConversation(updatedConv);
        saveConversations(updatedConvs);
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

    try {
      const planRes = await fetch("https://localhost:5000/api/generate_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: message.data?.task || input,
          session_id: sessionId,
          answers: answers
        }),
      });

      const planData = await planRes.json();
      
      if (planRes.ok && !planData.error) {
        const aiResponse = {
          role: 'assistant',
          content: `Thank you for the clarifications! I've created a detailed plan with ${planData.subtasks?.length} subtasks.`,
          timestamp: new Date().toISOString(),
          plan: planData
        };

        const updatedMessages = [...messages, aiResponse];
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
    }

    setIsLoading(false);
  };

  const assignAllToSlack = async (plan) => {
    if (!selectedChannel || !plan || !plan.subtasks) return;
    
    setSendingAll(true);
    const slackUserId = localStorage.getItem('slack_user_id');
    const originalPrompt = conversationHistory[conversationHistory.length - 1]?.prompt || "Task";
    
    try {
      // Send summary message
      const summaryMessage = `🚀 *New Task Breakdown*\n\n*Original Prompt:* ${originalPrompt}\n\n*Main Goal:* ${plan.goal}\n*Total Subtasks:* ${plan.subtasks.length}\n\n---\n`;
      
      await fetch("https://localhost:5000/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: slackUserId,
          channel: selectedChannel,
          text: summaryMessage,
        }),
      });
      
      // Send each subtask
      for (let i = 0; i < plan.subtasks.length; i++) {
        const subtask = plan.subtasks[i];
        const message = `📝 *Task ${i + 1}/${plan.subtasks.length}: ${subtask.title}*\n\n*Description:* ${subtask.description}\n*Assigned to:* ${subtask.assigned_to}\n*Deadline:* ${subtask.deadline}\n*Expected Output:* ${subtask.output}\n*Clarity Score:* ${subtask.clarity_score}%`;
        
        await fetch("https://localhost:5000/api/send_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: slackUserId,
            channel: selectedChannel,
            text: message,
          }),
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      alert(`✅ All ${plan.subtasks.length} tasks sent to Slack!`);
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

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#171717] flex flex-col border-r border-gray-700 overflow-hidden`}>
        <div className="p-3 space-y-2">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">New chat</span>
          </button>

          <button
            onClick={() => setShowProjectModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-purple-600 bg-purple-600/10 hover:bg-purple-600/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm">New project</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400">Projects</div>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setConversations(project.conversations || []);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors mb-1 ${
                  selectedProject?.id === project.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="truncate font-medium">{project.name}</div>
                {project.repo && (
                  <div className="text-xs text-gray-400 truncate">📁 {project.repo.name}</div>
                )}
              </button>
            ))}
          </div>

          {selectedProject && (
            <>
              <div className="border-t border-gray-700 my-2"></div>
              <div className="py-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400">Chats</div>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setCurrentConversation(conv);
                      setMessages(conv.messages || []);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors ${
                      currentConversation?.id === conv.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="truncate">{conv.title}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-3 border-t border-gray-700 space-y-2">
          {!githubConnected && (
            <button
              onClick={connectGithub}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-xs"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Connect GitHub
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <SlackConnectButton />
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="flex-1 truncate">{user?.name || 'User'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 text-center"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-700 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm font-semibold">Feeta AI</div>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedProject && (
              <>
                <div className="text-sm text-gray-400">
                  Project: <span className="text-white">{selectedProject.name}</span>
                </div>
                {selectedProject.repo ? (
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {selectedProject.repo.full_name}
                    <button
                      onClick={() => setShowRepoSelector(true)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRepoSelector(true)}
                    className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded"
                  >
                    Connect Repo
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedProject ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <h1 className="text-4xl font-semibold mb-4">Welcome to Feeta AI</h1>
              <p className="text-gray-400 mb-8">Create a project to get started</p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
              >
                Create Your First Project
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <h1 className="text-4xl font-semibold mb-8">Where should we begin?</h1>
              <div className="w-full max-w-3xl grid grid-cols-2 gap-4">
                {[
                  { title: "Dashboard", desc: "Create analytics dashboard", prompt: "Build a complete dashboard with analytics" },
                  { title: "Authentication", desc: "Implement user auth", prompt: "Add user authentication system" },
                  { title: "Database", desc: "Configure data layer", prompt: "Setup database schema and migrations" },
                  { title: "API", desc: "Build backend APIs", prompt: "Create REST API endpoints" }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.prompt)}
                    className="p-4 rounded-xl border border-gray-600 hover:bg-gray-700 transition-colors text-left"
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
                />
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
                    <div className="flex-1">Thinking...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {selectedProject?.repo && (
          <div className="border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#40414F] rounded-2xl border border-gray-600 shadow-lg">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything"
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
        )}
      </div>

      {/* Modals */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
              placeholder="Project name"
              className="w-full bg-[#40414F] border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={createProject}
                className="flex-1 bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowProjectModal(false)}
                className="flex-1 bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepoSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Select Repository</h3>
            <div className="grid grid-cols-2 gap-3">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => connectRepoToProject(repo)}
                  className="p-4 bg-[#343541] border border-gray-600 rounded-lg hover:border-purple-500 transition-colors text-left"
                >
                  <div className="font-medium text-sm">{repo.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{repo.language || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 mt-1">{repo.full_name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRepoSelector(false)}
              className="mt-4 w-full bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Message Component
function MessageComponent({ message, index, onSubmitAnswers, onAssignAll, channels, selectedChannel, setSelectedChannel, sendingAll, userName }) {
  const [answers, setAnswers] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [localSelectedChannel, setLocalSelectedChannel] = useState(selectedChannel);

  return (
    <div className={`mb-8 ${message.role === 'user' ? '' : 'bg-[#2A2A2A] -mx-4 px-4 py-6'}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === 'user' ? 'bg-purple-600' : 'bg-[#10A37F]'
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
                    <div key={qi} className="bg-[#343541] rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm font-semibold flex-1">{questionText}</span>
                        {explanation && (
                          <button
                            onMouseEnter={() => setActiveTooltip(qi)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            className="text-xs text-gray-400 hover:text-gray-300"
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
                        className="w-full bg-[#40414F] border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  );
                })}
                <button
                  onClick={() => onSubmitAnswers(index, answers)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  Submit Answers
                </button>
              </div>
            )}

            {/* Plan */}
            {message.plan && (
              <div className="bg-[#343541] rounded-xl p-6 mt-4">
                <h3 className="text-lg font-semibold mb-2">{message.plan.main_task}</h3>
                <p className="text-sm text-gray-400 mb-4">{message.plan.goal}</p>
                <div className="space-y-3 mb-6">
                  {message.plan.subtasks?.map((subtask, si) => (
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

                {/* Global Assignment */}
                <div className="pt-4 border-t border-gray-600">
                  <h5 className="font-semibold mb-3 text-purple-400">🚀 Assign All to Slack</h5>
                  <div className="flex gap-3">
                    <select
                      value={localSelectedChannel}
                      onChange={(e) => {
                        setLocalSelectedChannel(e.target.value);
                        setSelectedChannel(e.target.value);
                      }}
                      className="flex-1 bg-[#40414F] border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
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
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg whitespace-nowrap"
                    >
                      {sendingAll ? "Sending..." : `Send ${message.plan.subtasks?.length} Tasks`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
