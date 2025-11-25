'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

export default function ClarifyingQuestionsCenter() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/feeta/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setQuestions((await res.json()).questions || []);
  };

  const answerQuestion = async (qId, answer) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/feeta/questions/${qId}/answer`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    });
    loadQuestions();
  };

  return (
    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">❓ Clarifying Questions</h3>
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <p className="text-sm font-medium text-white mb-3">{q.question}</p>
            <input
              type="text"
              placeholder="Your answer..."
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && answerQuestion(q.id, e.target.value)}
            />
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No pending questions</p>
        )}
      </div>
    </div>
  );
}
