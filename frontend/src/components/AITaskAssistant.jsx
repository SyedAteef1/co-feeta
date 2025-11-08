"use client";
import { useState, useEffect } from "react";

function SubtaskCard({ subtask, index }) {
  const [showAssign, setShowAssign] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const slackUserId = localStorage.getItem('slack_user_id');
    if (slackUserId) {
      fetchChannels(slackUserId);
    }
  }, []);

  const fetchChannels = async (userId) => {
    try {
      const res = await fetch(`https://localhost:5000/api/list_conversations?user_id=${userId}`);
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  const assignToSlack = async () => {
    if (!selectedChannel) return;
    setSending(true);
    
    const slackUserId = localStorage.getItem('slack_user_id');
    const message = `📝 *New Task Assignment*\n\n*Task:* ${subtask.title || subtask.task}\n*Description:* ${subtask.description}\n*Role:* ${subtask.role || subtask.assigned_to}\n*Deadline:* ${subtask.deadline}\n*Output:* ${subtask.output}`;
    
    try {
      await fetch("https://localhost:5000/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: slackUserId,
          channel: selectedChannel,
          text: message,
        }),
      });
      setShowAssign(false);
      setSelectedChannel("");
    } catch (err) {
      console.error("Error sending to Slack:", err);
    }
    setSending(false);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-3">
      <div className="flex justify-between mb-2">
        <strong className="text-sm">{index + 1}. {subtask.title || subtask.task}</strong>
        <span className="text-xs text-green-400">{subtask.deadline}</span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{subtask.description}</p>
      <div className="flex gap-4 text-xs text-gray-500 mb-3">
        <span>👤 {subtask.role || subtask.assigned_to}</span>
        <span>📦 {subtask.output}</span>
        <span>✅ {subtask.clarity_score}%</span>
      </div>
      
      {!showAssign ? (
        <button
          onClick={() => setShowAssign(true)}
          className="text-xs px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        >
          Assign to Slack
        </button>
      ) : (
        <div className="mt-2 p-3 bg-black rounded border border-gray-700">
          <label className="block text-xs mb-2 text-gray-400">Select Channel:</label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs mb-2"
          >
            <option value="">-- Select Channel --</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.is_channel ? '#' : ''}{ch.name || 'Direct Message'}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={assignToSlack}
              disabled={!selectedChannel || sending}
              className="flex-1 text-xs px-3 py-1 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowAssign(false)}
              className="flex-1 text-xs px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AITaskAssistant({ repos, githubToken }) {
  const [task, setTask] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [plan, setPlan] = useState(null);
  const [logs, setLogs] = useState([]);
  const [searchQueries, setSearchQueries] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // New state for conversation history and global assignment
  const [conversationHistory, setConversationHistory] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [channels, setChannels] = useState([]);
  const [sendingAll, setSendingAll] = useState(false);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    console.log(msg);
  };

  // Fetch Slack channels on mount
  useEffect(() => {
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

  // Fetch conversation history when session changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!sessionId) return;
      
      try {
        const res = await fetch(`https://localhost:5000/api/conversation_history/${sessionId}`);
        const data = await res.json();
        setConversationHistory(data.conversations || []);
        addLog(`📜 Loaded ${data.conversations?.length || 0} previous conversations`);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId]);

  const assignAllToSlack = async () => {
    if (!selectedChannel || !plan || !plan.subtasks) return;
    
    setSendingAll(true);
    addLog(`📤 Sending ${plan.subtasks.length} tasks to Slack...`);
    
    const slackUserId = localStorage.getItem('slack_user_id');
    const currentConversation = conversationHistory[conversationHistory.length - 1];
    const originalPrompt = currentConversation?.prompt || task;
    
    try {
      // Send summary message first
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
        const message = `📝 *Task ${i + 1}/${plan.subtasks.length}: ${subtask.title || subtask.task}*\n\n*Description:* ${subtask.description}\n*Role:* ${subtask.role || subtask.assigned_to}\n*Deadline:* ${subtask.deadline}\n*Expected Output:* ${subtask.output}\n*Clarity Score:* ${subtask.clarity_score}%`;
        
        await fetch("https://localhost:5000/api/send_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: slackUserId,
            channel: selectedChannel,
            text: message,
          }),
        });
        
        addLog(`✅ Sent task ${i + 1}/${plan.subtasks.length}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      addLog(`✅ All tasks sent successfully to Slack!`);
    } catch (err) {
      console.error("Error sending to Slack:", err);
      addLog(`❌ Error sending tasks: ${err.message}`);
    }
    
    setSendingAll(false);
  };

  const continueWithNewPrompt = () => {
    // Keep session ID, reset task and plan for new prompt
    setTask("");
    setPlan(null);
    setQuestions([]);
    setAnswers({});
    setStatus("idle");
    addLog("🔄 Ready for new prompt in same session");
  };

  const analyzeTask = async () => {
    addLog("🚀 Starting task analysis with repository context...");
    setStatus("analyzing");
    
    try {
      // Support both single repo (legacy) and multiple repos
      let repositories = [];
      if (repos && Array.isArray(repos)) {
        repositories = repos.map(repo => {
          const [owner, repoName] = repo?.full_name?.split('/') || [];
          return { owner, repo: repoName, type: repo.type || 'unknown' };
        });
        addLog(`📦 Analyzing ${repositories.length} repositories`);
        repositories.forEach((r, i) => {
          addLog(`  ${i + 1}. ${r.owner}/${r.repo} (${r.type})`);
        });
      } else if (repos?.full_name) {
        // Single repo fallback
        const [owner, repoName] = repos.full_name.split('/');
        repositories = [{ owner, repo: repoName, type: 'unknown' }];
        addLog(`📦 Analyzing single repo: ${owner}/${repoName}`);
      }
      
      if (sessionId) {
        addLog(`🔄 Continuing session: ${sessionId}`);
      }
      
      const res = await fetch("https://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          task,
          session_id: sessionId,
          repositories,  // Send array of repositories
          github_token: githubToken
        }),
      });
      
      addLog(`✅ Response status: ${res.status}`);
      const data = await res.json();
      addLog(`📦 Response data: ${JSON.stringify(data)}`);
      
      setSessionId(data.session_id);
      
      if (data.status === "needs_context") {
        addLog(`🔍 AI needs to search codebase: ${data.search_queries?.length} queries`);
        setStatus("needs_context");
        setSearchQueries(data.search_queries || []);
        addLog("🔎 Searching repository for relevant code...");
        setTimeout(() => generatePlan(data.session_id), 1000);
      } else if (data.status === "clear") {
        addLog("✅ Task is clear, generating plan...");
        setStatus("clear");
        generatePlan(data.session_id);
      } else {
        addLog(`❓ Task needs clarification (${data.questions?.length} questions)`);
        setStatus("ambiguous");
        setQuestions(data.questions || []);
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus("error");
    }
  };

  const generatePlan = async (sid = sessionId) => {
    addLog("🔧 Generating implementation plan...");
    setStatus("generating");
    
    try {
      addLog("📡 Calling /api/generate_plan endpoint");
      const res = await fetch("https://localhost:5000/api/generate_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, session_id: sid, answers }),
      });
      
      addLog(`✅ Response status: ${res.status}`);
      const data = await res.json();
      addLog(`📦 Plan generated with ${data.subtasks?.length} subtasks`);
      
      setPlan(data);
      setStatus("complete");
    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="bg-gray-900 border border-[#4C3BCF]/30 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Task Assistant</h3>
      
      {/* Input Section */}
      <div className="mb-4">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g., Build the Feeta AI dashboard in dark mode"
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4C3BCF] min-h-[80px]"
        />
        <button
          onClick={analyzeTask}
          disabled={!task || status === "analyzing"}
          className="mt-2 px-6 py-3 bg-[#4C3BCF] rounded-lg hover:bg-[#4C3BCF]/80 disabled:opacity-50"
        >
          {status === "analyzing" ? "Analyzing..." : "Analyze Task"}
        </button>
      </div>

      {/* Context Search Section */}
      {status === "needs_context" && searchQueries.length > 0 && (
        <div className="bg-black border border-yellow-700 rounded-lg p-6 mb-4">
          <h4 className="font-semibold mb-3 text-yellow-400">🔍 Analyzing Codebase</h4>
          <p className="text-sm text-gray-400 mb-3">AI is searching for relevant code...</p>
          {searchQueries.map((q, i) => (
            <div key={i} className="text-xs text-yellow-300 mb-1">• {q}</div>
          ))}
          <div className="mt-3 text-sm text-gray-500">Generating implementation plan...</div>
        </div>
      )}

      {/* Questions Section */}
      {status === "ambiguous" && questions.length > 0 && (
        <div className="bg-black border border-gray-700 rounded-lg p-6 mb-4">
          <h4 className="font-semibold mb-3 text-[#4C3BCF]">❓ Clarification Needed</h4>
          {questions.map((q, i) => {
            // Handle both old format (string) and new format (object with question + explanation)
            const questionText = typeof q === 'string' ? q : q.question;
            const explanation = typeof q === 'object' ? q.explanation : null;
            
            return (
              <div key={i} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm flex-1">{questionText}</label>
                  {explanation && (
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setActiveTooltip(i)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                        className="w-5 h-5 rounded-full bg-[#4C3BCF]/20 border border-[#4C3BCF] flex items-center justify-center text-[#4C3BCF] hover:bg-[#4C3BCF]/30 transition-colors text-xs font-bold"
                        aria-label="More information"
                      >
                        i
                      </button>
                      {activeTooltip === i && (
                        <div className="absolute right-0 top-7 z-10 w-64 bg-gray-800 border border-[#4C3BCF]/50 rounded-lg p-3 shadow-xl">
                          <div className="text-xs text-gray-300 leading-relaxed">
                            {explanation}
                          </div>
                          <div className="absolute -top-2 right-3 w-3 h-3 bg-gray-800 border-t border-l border-[#4C3BCF]/50 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3BCF]"
                  placeholder="Your answer..."
                />
              </div>
            );
          })}
          <button
            onClick={() => generatePlan()}
            className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700"
          >
            Generate Plan
          </button>
        </div>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div className="bg-black border border-blue-700 rounded-lg p-6 mb-4">
          <h4 className="font-semibold mb-3 text-blue-400">📜 Conversation History ({conversationHistory.length})</h4>
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {conversationHistory.map((conv, i) => (
              <div key={i} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(conv.timestamp).toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-blue-300 mb-1">
                  Prompt {i + 1}: {conv.prompt}
                </div>
                {conv.plan && (
                  <div className="text-xs text-gray-400 mt-2">
                    ✅ Generated {conv.plan.subtasks?.length} subtasks
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Section */}
      {plan && (
        <div className="bg-black border border-green-700 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-green-400">📋 {plan.main_task}</h4>
              <p className="text-sm text-gray-400 mt-1">{plan.goal}</p>
            </div>
            <button
              onClick={continueWithNewPrompt}
              className="px-3 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700"
            >
              ➕ New Prompt
            </button>
          </div>
          
          <h5 className="font-semibold mb-2">Subtasks:</h5>
          {plan.subtasks?.map((sub, i) => (
            <SubtaskCard key={i} subtask={sub} index={i} />
          ))}
          
          {/* Global Assignment Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h5 className="font-semibold mb-3 text-purple-400">🚀 Assign All Tasks to Slack</h5>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs mb-2 text-gray-400">Select Channel/Group:</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Select Channel --</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.is_channel ? '#' : ''}{ch.name || 'Direct Message'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={assignAllToSlack}
                disabled={!selectedChannel || sendingAll}
                className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingAll ? "Sending..." : `Send All ${plan.subtasks?.length} Tasks`}
              </button>
            </div>
            {selectedChannel && (
              <div className="mt-2 text-xs text-gray-500">
                📝 Will send original prompt + {plan.subtasks?.length} detailed tasks to selected channel
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div className="bg-black border border-gray-700 rounded-lg p-4">
        <h5 className="font-semibold mb-2 text-sm">📊 Console Logs</h5>
        <div className="bg-black p-3 rounded max-h-[200px] overflow-auto font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="text-green-400 mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
