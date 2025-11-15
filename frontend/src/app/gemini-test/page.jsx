'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function GeminiTest() {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState(null);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    const userMessage = { role: 'user', content: prompt };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setPrompt('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/test-gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt,
          history: chatHistory
        })
      });

      const data = await res.json();
      
      if (data.success) {
        const modelMessage = { role: 'model', content: data.response };
        setChatHistory([...newHistory, modelMessage]);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setError('');
  };

  const testBackend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      setBackendStatus(data);
      setTimeout(() => setBackendStatus(null), 5000);
    } catch (err) {
      setBackendStatus({ status: 'error', message: err.message });
      setTimeout(() => setBackendStatus(null), 5000);
    }
  };

  const testPing = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ping`);
      const data = await res.json();
      setBackendStatus(data);
      setTimeout(() => setBackendStatus(null), 5000);
    } catch (err) {
      setBackendStatus({ status: 'error', message: err.message });
      setTimeout(() => setBackendStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gemini Prompt Tester</h1>
          <div className="flex gap-2">
            <button
              onClick={testBackend}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
              Test /health
            </button>
            <button
              onClick={testPing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Test /api/ping
            </button>
          </div>
        </div>
        
        {backendStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            backendStatus.status === 'ok' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={backendStatus.status === 'ok' ? 'text-green-800' : 'text-red-800'}>
              <strong>Status:</strong> {backendStatus.status}<br/>
              <strong>Message:</strong> {backendStatus.message}<br/>
              {backendStatus.gemini_configured !== undefined && (
                <><strong>Gemini:</strong> {backendStatus.gemini_configured ? '✓ Configured' : '✗ Not Configured'}</>
              )}
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Chat Session</h2>
            <button
              onClick={clearChat}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear Chat
            </button>
          </div>
          
          <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-center">Start a conversation...</p>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-white border shadow-sm px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              className="flex-1 border rounded-lg p-3"
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !prompt.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
