'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const GitHubIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [repoDetails, setRepoDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [taskQuery, setTaskQuery] = useState('');
  const [taskAnalysis, setTaskAnalysis] = useState(null);
  const [analyzingTask, setAnalyzingTask] = useState(false);
  const [phase, setPhase] = useState('input');
  const [answers, setAnswers] = useState({});
  const searchParams = useSearchParams();

  useEffect(() => {
    const user_id = searchParams.get('user_id');
    const github_username = searchParams.get('username');
    
    if (user_id && github_username) {
      localStorage.setItem('github_user_id', user_id);
      localStorage.setItem('github_username', github_username);
      setUserId(user_id);
      setUsername(github_username);
      setIsConnected(true);
      fetchRepos(user_id);
    }
  }, [searchParams]);

  const handleConnect = () => {
    window.location.href = "https://localhost:5000/github/install";
  };

  const fetchRepos = async (user_id) => {
    setLoading(true);
    try {
      const response = await fetch(`https://localhost:5000/github/api/repos?user_id=${user_id}`);
      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error('Error fetching repos:', error);
    }
    setLoading(false);
  };

  const searchCode = async () => {
    if (!searchQuery || !selectedRepo) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://localhost:5000/github/api/search?user_id=${userId}&query=${encodeURIComponent(searchQuery)}&repo=${selectedRepo.full_name}`
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Error searching code:', error);
    }
    setLoading(false);
  };

  const fetchRepoDetails = async (repo) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://localhost:5000/github/api/repo_details?user_id=${userId}&owner=${repo.owner.login}&repo=${repo.name}`
      );
      const data = await response.json();
      setRepoDetails(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching repo details:', error);
    }
    setLoading(false);
  };

  const analyzeTask = async (withAnswers = false) => {
    if (!taskQuery || !selectedRepo) return;
    
    setAnalyzingTask(true);
    try {
      const response = await fetch('https://localhost:5000/github/api/analyze_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          task: taskQuery,
          answers: withAnswers ? answers : undefined
        })
      });
      const data = await response.json();
      setTaskAnalysis(data);
      setPhase(data.phase);
    } catch (error) {
      console.error('Error analyzing task:', error);
    }
    setAnalyzingTask(false);
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers({ ...answers, [questionIndex]: answer });
  };

  const submitAnswers = () => {
    analyzeTask(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">GitHub Integration</h2>
          <p className="text-gray-600">Search and analyze your repositories</p>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="w-full flex justify-center items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Connect with GitHub
          </button>
        ) : (
          <div>
            <div className="bg-green-100 p-4 rounded-md mb-6">
              <span className="text-green-800 font-medium">✅ GitHub Connected: {username}</span>
            </div>

            {loading ? (
              <p className="text-center">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold mb-4">Repositories ({repos.length})</h3>
                  <div className="space-y-2">
                    {repos.map((repo) => (
                      <div
                        key={repo.id}
                        className={`p-4 bg-white border rounded-md hover:shadow-md ${
                          selectedRepo?.id === repo.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        <div onClick={() => setSelectedRepo(repo)} className="cursor-pointer">
                          <h4 className="font-bold">{repo.name}</h4>
                          <p className="text-sm text-gray-600">{repo.description || 'No description'}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                              ⭐ {repo.stargazers_count}
                            </span>
                            {repo.language && (
                              <span className="text-xs px-2 py-1 bg-blue-200 rounded">
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => fetchRepoDetails(repo)}
                          className="mt-2 w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRepo && (
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">{selectedRepo.name}</h3>
                    
                    {/* AI Task Analysis */}
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-bold mb-2 text-purple-900">🤖 AI Task Assistant</h4>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={taskQuery}
                          onChange={(e) => setTaskQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && analyzeTask()}
                          placeholder="e.g., Add payment gateway integration"
                          className="flex-1 border rounded px-4 py-2"
                        />
                        <button
                          onClick={analyzeTask}
                          disabled={analyzingTask}
                          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                          {analyzingTask ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                      
                      {taskAnalysis && phase === 'intent_analysis' && (
                        <div className="bg-white p-4 rounded border">
                          <h5 className="font-bold mb-3 text-purple-900">🎯 Intent: {taskAnalysis.intent.replace('_', ' ').toUpperCase()}</h5>
                          
                          <div className="mb-4 p-3 bg-blue-50 rounded">
                            <p className="text-sm text-blue-900">I need to clarify a few things to provide the best implementation plan:</p>
                          </div>
                          
                          <div className="space-y-4">
                            {taskAnalysis.questions.map((q, idx) => (
                              <div key={idx} className="border-l-4 border-purple-500 pl-4">
                                <p className="font-medium mb-2">{q.question}</p>
                                <div className="space-y-2">
                                  {q.options.map((option, optIdx) => (
                                    <label key={optIdx} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`question_${idx}`}
                                        value={option}
                                        checked={answers[idx] === option}
                                        onChange={() => handleAnswerSelect(idx, option)}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={submitAnswers}
                            disabled={Object.keys(answers).length !== taskAnalysis.questions.length}
                            className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Generate Implementation Plan
                          </button>
                        </div>
                      )}
                      
                      {taskAnalysis && phase === 'task_generation' && (
                        <div className="bg-white p-4 rounded border">
                          <h5 className="font-bold mb-3 text-green-900">✅ Concrete Implementation Plan</h5>
                          
                          <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
                            <h6 className="font-bold text-green-900 mb-2">Main Task</h6>
                            <p className="text-sm">{taskAnalysis.main_task}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h6 className="font-bold mb-2">📝 Subtasks</h6>
                            <div className="space-y-2">
                              {taskAnalysis.subtasks.map((subtask, idx) => (
                                <div key={idx} className="flex items-start space-x-2 text-sm">
                                  <span className="text-green-600">✓</span>
                                  <span>{subtask}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {taskAnalysis.files_to_create.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-bold mb-2">📄 Files to Create</h6>
                              <div className="space-y-1">
                                {taskAnalysis.files_to_create.map((file, idx) => (
                                  <div key={idx} className="text-sm text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded">
                                    + {file}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {taskAnalysis.files_to_modify.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-bold mb-2">✏️ Files to Modify</h6>
                              <div className="space-y-1">
                                {taskAnalysis.files_to_modify.map((file, idx) => (
                                  <div key={idx} className="text-sm text-orange-700 font-mono bg-orange-50 px-2 py-1 rounded">
                                    ~ {file}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setPhase('input');
                              setTaskQuery('');
                              setAnswers({});
                              setTaskAnalysis(null);
                            }}
                            className="w-full mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Start New Task
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Code Search */}
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">🔍 Code Search</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchCode()}
                          placeholder="Search code..."
                          className="flex-1 border rounded px-4 py-2"
                        />
                        <button
                          onClick={searchCode}
                          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-3">
                        {searchResults.map((result) => (
                          <div key={result.sha} className="p-4 bg-white border rounded-md">
                            <h4 className="font-bold text-blue-600">{result.name}</h4>
                            <p className="text-sm text-gray-600">{result.path}</p>
                            <a
                              href={result.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                            >
                              View on GitHub →
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Repo Details Modal */}
        {showDetailsModal && repoDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">{repoDetails.repo.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-bold mb-2">Description</h4>
                  <p className="text-gray-700">{repoDetails.repo.description || 'No description'}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-sm px-2 py-1 bg-gray-200 rounded">⭐ {repoDetails.repo.stargazers_count}</span>
                    <span className="text-sm px-2 py-1 bg-gray-200 rounded">🍴 {repoDetails.repo.forks_count}</span>
                    {repoDetails.repo.language && (
                      <span className="text-sm px-2 py-1 bg-blue-200 rounded">{repoDetails.repo.language}</span>
                    )}
                  </div>
                </div>

                {repoDetails.readme && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-bold mb-2">README</h4>
                    <a
                      href={repoDetails.readme.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View README on GitHub →
                    </a>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-bold mb-2">Folder Structure ({repoDetails.tree.length} items)</h4>
                  <div className="max-h-96 overflow-y-auto bg-white p-3 rounded border">
                    {repoDetails.tree.slice(0, 100).map((item, idx) => (
                      <div key={idx} className="text-sm py-1 font-mono text-gray-700">
                        {item.type === 'tree' ? '📁' : '📄'} {item.path}
                      </div>
                    ))}
                    {repoDetails.tree.length > 100 && (
                      <div className="text-sm text-gray-500 mt-2">... and {repoDetails.tree.length - 100} more items</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
