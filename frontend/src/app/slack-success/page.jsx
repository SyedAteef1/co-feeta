'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SlackSuccessContent() {
  const searchParams = useSearchParams();
  const user_id = searchParams.get('user_id');
  const team_id = searchParams.get('team_id');
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [messageText, setMessageText] = useState("");
  const [mentionUserId, setMentionUserId] = useState("");
  const [channelMembers, setChannelMembers] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedTask, setAiGeneratedTask] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  const [status, setStatus] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('=== FRONTEND DEBUG ===');
    console.log('User ID:', user_id);
    console.log('Team ID:', team_id);
    if (typeof window !== 'undefined') {
      console.log('Current URL:', window.location.href);
      
      // Save user_id and team_id to localStorage when they come from OAuth
      if (user_id && team_id) {
        localStorage.setItem('slack_user_id', user_id);
        localStorage.setItem('slack_team_id', team_id);
        console.log('Saved to localStorage:', { user_id, team_id });
      }
    }
  }, [user_id, team_id]);

  useEffect(() => {
    // Try to get user_id from URL params or localStorage
    let currentUserId = user_id;
    if (!currentUserId && typeof window !== 'undefined') {
      currentUserId = localStorage.getItem('slack_user_id');
      console.log('Retrieved user_id from localStorage:', currentUserId);
    }
    
    if (!currentUserId) {
      console.log('No user_id found, skipping API call');
      setLoading(false);
      return;
    }
    
    console.log('Fetching conversations for user:', currentUserId);
    setStatus('Loading channels...');
    
    // Fetch channels
    fetch(`https://localhost:5000/api/list_conversations?user_id=${currentUserId}`)
      .then((r) => {
        console.log('API Response status:', r.status);
        return r.json();
      })
      .then((data) => {
        console.log('API Response data:', data);
        setApiResponse(data);
        
        if (data && data.channels) {
          setChannels(data.channels);
          setStatus(`Found ${data.channels.length} channels/conversations`);
          console.log('Channels loaded:', data.channels);
        } else if (data && data.ok === false) {
          setStatus(`Slack API Error: ${data.error}`);
          console.error('Slack API Error:', data);
        } else {
          setStatus('No channels found or unexpected response format');
          console.warn('Unexpected response format:', data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Network error:', err);
        setStatus(`Network error: ${err.message}`);
        setLoading(false);
      });
    
    // Note: Users are fetched per channel via channel_members endpoint
  }, [user_id]);

  // Fetch channel members when channel is selected
  useEffect(() => {
    const currentUserId = user_id || (typeof window !== 'undefined' ? localStorage.getItem('slack_user_id') : null);
    
    if (!selectedChannel || !currentUserId) {
      setChannelMembers([]);
      return;
    }
    
    fetch(`https://localhost:5000/api/channel_members?user_id=${currentUserId}&channel=${selectedChannel}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.members) {
          setChannelMembers(data.members);
          console.log('Channel members loaded:', data.members);
        } else {
          setChannelMembers([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching channel members:', err);
        setChannelMembers([]);
      });
  }, [selectedChannel, user_id]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setAiLogs(prev => [...prev, { time: timestamp, message, type }]);
  };

  const generateTask = async () => {
    if (!aiPrompt.trim()) {
      setStatus("Enter a task prompt first.");
      addLog("Error: No prompt entered", "error");
      return;
    }
    
    setGeneratingAI(true);
    setAiLogs([]);
    setAiGeneratedTask("");
    setStatus("AI is generating task...");
    addLog("Starting AI task generation...", "info");
    addLog("Backend URL: http://localhost:5001/api/generate_task", "info");
    
    try {
      const assigneeName = channelMembers.find(m => m.id === mentionUserId)?.real_name || "team member";
      addLog(`Assignee: ${assigneeName}`, "info");
      addLog(`Prompt: "${aiPrompt}"`, "info");
      addLog("Calling GLM-4-Flash API...", "info");
      
      const res = await fetch("http://localhost:5001/api/generate_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          assignee_name: assigneeName
        }),
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!res.ok) {
        addLog(`API Response Status: ${res.status} ${res.statusText}`, "error");
        const errorText = await res.text();
        addLog(`Error details: ${errorText}`, "error");
        setStatus(`API error: ${res.status} ${res.statusText}`);
        return;
      }
      
      addLog(`API Response Status: ${res.status}`, "success");
      const data = await res.json();
      addLog(`Response received`, "info");
      
      if (data.ok) {
        addLog("Task generated successfully!", "success");
        addLog(`Task length: ${data.task.length} characters`, "info");
        setAiGeneratedTask(data.task);
        setMessageText(data.task);
        setStatus("Task generated! Review and send.");
      } else {
        addLog(`Generation failed: ${data.error || "Unknown error"}`, "error");
        setStatus("AI generation failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      addLog(`Fetch Error: ${e.message}`, "error");
      addLog(`Error Type: ${e.name}`, "error");
      if (e.message.includes('Failed to fetch')) {
        addLog("Possible causes: Backend not running, SSL cert not accepted, or CORS issue", "error");
        addLog("Solution: Make sure backend is running and SSL certificate is accepted", "info");
      }
      setStatus("AI error: " + e.message);
    } finally {
      setGeneratingAI(false);
      addLog("Generation process completed", "info");
    }
  };

  const sendMessage = async () => {
    if (!selectedChannel || !messageText) {
      setStatus("Choose channel and write a message.");
      return;
    }
    setStatus("Sending...");
    
    const currentUserId = user_id || (typeof window !== 'undefined' ? localStorage.getItem('slack_user_id') : null);
    
    try {
      const res = await fetch("https://localhost:5000/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          channel: selectedChannel,
          text: messageText,
          mention_user_id: mentionUserId || null
        })
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Message sent!");
        setMessageText("");
        setMentionUserId("");
      } else {
        setStatus("Error: " + JSON.stringify(data));
      }
    } catch (e) {
      setStatus("Network error: " + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Slack Connected 🎉</h1>
      <p>User ID: <strong>{user_id}</strong> — Team ID: <strong>{team_id}</strong></p>

      {loading && <p>Loading channels...</p>}
      
      <h3>Channels & Conversations</h3>
      <div>
        <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={{ padding: 8, fontSize: 16, width: '100%' }}>
          <option value="">-- Select channel --</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.is_channel ? `# ${c.name}` : 
               c.is_group ? `🔒 ${c.name}` : 
               c.is_im ? `👤 DM` : 
               c.is_mpim ? `👥 Group DM` : 
               c.name || c.id}
            </option>
          ))}
        </select>
      </div>
      
      {channels.length > 0 && (
        <div style={{ marginTop: 16, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <h4>Available Channels ({channels.length}):</h4>
          <ul style={{ fontSize: 12, maxHeight: 200, overflowY: 'auto' }}>
            {channels.map((c) => (
              <li key={c.id} style={{ marginBottom: 4 }}>
                <strong>{c.name || c.id}</strong> - {c.is_channel ? 'Public Channel' : c.is_group ? 'Private Channel' : c.is_im ? 'Direct Message' : c.is_mpim ? 'Group DM' : 'Unknown'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, border: '2px dashed #ddd' }}>
        <h4 style={{ marginTop: 0, color: '#2f8a6a' }}>🤖 AI Task Generator</h4>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Describe the task</label>
        <textarea
          placeholder="e.g., Create a marketing campaign for our new product launch"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={2}
          style={{ width: "100%", padding: 10, fontSize: 14, marginBottom: 10, border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button 
          onClick={generateTask} 
          disabled={generatingAI}
          style={{ 
            padding: "8px 16px", 
            borderRadius: 6, 
            background: generatingAI ? "#ccc" : "#2f8a6a", 
            color: "white", 
            border: "none", 
            cursor: generatingAI ? "not-allowed" : "pointer"
          }}
        >
          {generatingAI ? "Generating..." : "✨ Generate Task with AI"}
        </button>
        {!selectedChannel && (
          <small style={{ display: 'block', marginTop: 4, color: '#888' }}>Tip: Select a channel first to personalize the task</small>
        )}
        
        {aiLogs.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: '#1e1e1e', borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: '#00ff00', fontSize: 12 }}>📊 Generation Logs:</strong>
              <button 
                onClick={() => setAiLogs([])} 
                style={{ 
                  padding: "2px 6px", 
                  fontSize: 11, 
                  background: '#444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 3, 
                  cursor: 'pointer' 
                }}
              >
                Clear Logs
              </button>
            </div>
            {aiLogs.map((log, idx) => (
              <div key={idx} style={{ 
                fontSize: 11, 
                fontFamily: 'monospace', 
                marginBottom: 4,
                color: log.type === 'error' ? '#ff6b6b' : log.type === 'success' ? '#51cf66' : '#a0a0a0'
              }}>
                <span style={{ color: '#888' }}>[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        )}
        
        {aiGeneratedTask && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 6, border: '1px solid #2f8a6a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: '#2f8a6a' }}>✅ Generated Task:</strong>
              <button 
                onClick={() => setAiGeneratedTask("")} 
                style={{ 
                  padding: "4px 8px", 
                  fontSize: 12, 
                  background: '#ff4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: 'pointer' 
                }}
              >
                Clear
              </button>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, margin: 0, fontFamily: 'inherit', lineHeight: 1.5 }}>
              {aiGeneratedTask}
            </pre>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Assign To (optional)</label>
        <select
          value={mentionUserId}
          onChange={(e) => setMentionUserId(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 14, marginBottom: 10, border: "1px solid #ccc", borderRadius: 4 }}
          disabled={!selectedChannel}
        >
          <option value="">-- No mention --</option>
          {channelMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.display_name || member.real_name || member.name}
            </option>
          ))}
        </select>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Message</label>
        <textarea
          placeholder="Type your message here..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #ccc", borderRadius: 4 }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={sendMessage} style={{ padding: "8px 16px", borderRadius: 6, background: "#2f8a6a", color: "white", border: "none", cursor: "pointer" }}>
          Send Message
        </button>
      </div>

      <div style={{ marginTop: 12, color: "#333" }}>
        <small>{status}</small>
      </div>

      <div style={{ marginTop: 24 }}>
        <a href="/" style={{ color: "#555" }}>Back to home</a>
      </div>
      
      {apiResponse && (
        <div style={{ marginTop: 24, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <h4>Debug Info - API Response:</h4>
          <pre style={{ fontSize: 10, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SlackSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SlackSuccessContent />
    </Suspense>
  );
}
