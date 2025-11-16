'use client';
import { API_BASE_URL } from '@/config/api';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RadialBarChart, RadialBar, LabelList, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Tasks Page Component
function TasksPage({ user }) {
  console.log('🎯 TasksPage component rendered!', { user: user?.email || 'No user' });
  
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingFollowup, setSendingFollowup] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Follow-up handler
  const handleFollowup = async (task) => {
    const taskId = task.id || task._id;
    if (!taskId) {
      alert('Task ID not found');
      return;
    }
    setSendingFollowup(taskId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/follow-up`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Follow-up sent!');
        loadTasks();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Error sending follow-up');
    } finally {
      setSendingFollowup(null);
    }
  };

  const getLastChecked = (lastFollowupAt) => {
    if (!lastFollowupAt) return null;
    const lastCheck = new Date(lastFollowupAt);
    const now = new Date();
    const diffMs = now - lastCheck;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Apply filters function
  const applyFilters = () => {
    console.log('🔍 Applying filters...', {
      allTasksCount: allTasks.length,
      statusFilter,
      projectFilter,
      priorityFilter,
      searchQuery
    });
    
    // Start with all tasks
    let filtered = [...allTasks];
    const initialCount = filtered.length;

    // Status filter
    if (statusFilter !== 'all') {
      const before = filtered.length;
      filtered = filtered.filter(task => {
        const taskStatus = task.status || '';
        return taskStatus === statusFilter;
      });
      console.log(`Status filter (${statusFilter}): ${before} → ${filtered.length}`);
    }

    // Project filter
    if (projectFilter !== 'all') {
      const before = filtered.length;
      filtered = filtered.filter(task => {
        const projectId = String(task.project_id || task.project?.id || '');
        const filterId = String(projectFilter);
        const matches = projectId === filterId;
        return matches;
      });
      console.log(`Project filter (${projectFilter}): ${before} → ${filtered.length}`);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      const before = filtered.length;
      filtered = filtered.filter(task => {
        const priority = (task.priority || '').toLowerCase();
        if (priorityFilter === 'critical') {
          return priority === 'critical' || priority === 'high';
        } else if (priorityFilter === 'medium') {
          return priority === 'medium';
        } else if (priorityFilter === 'easy') {
          return priority === 'easy' || priority === 'low';
        }
        return false;
      });
      console.log(`Priority filter (${priorityFilter}): ${before} → ${filtered.length}`);
    }

    // Search by person name
    if (searchQuery.trim()) {
      const before = filtered.length;
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => {
        const assignedTo = (task.assigned_to || '').toLowerCase();
        return assignedTo.includes(query);
      });
      console.log(`Search filter (${searchQuery}): ${before} → ${filtered.length}`);
    }

    console.log(`✅ Filtered tasks: ${initialCount} → ${filtered.length}`);
    setFilteredTasks(filtered);
  };

  // Load data on mount and when component becomes visible
  useEffect(() => {
    console.log('🚀 TasksPage useEffect triggered - Loading tasks and projects');
    console.log('📍 Current state:', {
      allTasks: allTasks.length,
      filteredTasks: filteredTasks.length,
      isLoading,
      hasUser: !!user
    });
    
    // Always reload tasks when component mounts or becomes visible
    loadTasks();
    loadProjects();
  }, []);

  // Also reload tasks when user changes (in case of login/logout)
  useEffect(() => {
    if (user) {
      console.log('👤 User detected, reloading tasks');
      loadTasks();
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to load projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      setIsLoading(false);
      return;
    }

    console.log('🔑 Token found, length:', token.length);
    setIsLoading(true);
    
    try {
      console.log('📡 Fetching tasks from API: ${API_BASE_URL}/api/tasks');
      
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get response text first to see what we're dealing with
      const responseText = await response.text();
      console.log('📦 Raw response text:', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed JSON response:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        console.error('❌ Response text:', responseText);
        setAllTasks([]);
        setFilteredTasks([]);
        setIsLoading(false);
        return;
      }
      
      if (response.ok) {
        // Handle different response formats
        let tasks = [];
        if (Array.isArray(data)) {
          tasks = data;
          console.log('✅ Response is direct array');
        } else if (data.tasks && Array.isArray(data.tasks)) {
          tasks = data.tasks;
          console.log('✅ Response has tasks array');
        } else if (data.data && Array.isArray(data.data)) {
          tasks = data.data;
          console.log('✅ Response has data array');
        } else {
          console.warn('⚠️ Unexpected response format:', data);
          console.warn('⚠️ Response keys:', Object.keys(data));
          tasks = [];
        }
        
        console.log('✅ Tasks loaded:', tasks.length, 'tasks');
        if (tasks.length > 0) {
          console.log('📋 Sample task:', JSON.stringify(tasks[0], null, 2));
          console.log('📋 All task IDs:', tasks.map(t => t.id || t._id));
        } else {
          console.log('ℹ️ No tasks found in response');
          console.log('ℹ️ This could mean:');
          console.log('   1. No tasks have been created yet in any project');
          console.log('   2. Tasks exist but are not associated with your projects');
          console.log('   3. There is a project_id mismatch issue');
        }
        
        setAllTasks(tasks);
        // Immediately set filtered tasks to all tasks (no filters applied yet)
        setFilteredTasks(tasks);
        
        // Show alert if no tasks found (for debugging)
        if (tasks.length === 0) {
          console.warn('⚠️ WARNING: No tasks returned from API. Check if tasks exist in database.');
        }
      } else {
        console.error('❌ API returned error:', response.status);
        console.error('❌ Error data:', data);
        console.error('❌ Full response text:', responseText);
        setAllTasks([]);
        setFilteredTasks([]);
        
        // Show user-friendly error
        if (response.status === 401) {
          console.error('❌ Authentication failed - token may be expired');
        } else if (response.status === 500) {
          console.error('❌ Server error - check backend logs');
        }
      }
    } catch (error) {
      console.error('❌ Network/Request error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setAllTasks([]);
      setFilteredTasks([]);
    } finally {
      setIsLoading(false);
      console.log('✅ Loading complete');
    }
  };

  // Apply filters whenever filters or tasks change
  useEffect(() => {
    console.log('🔄 Filter effect triggered', {
      allTasksLength: allTasks.length,
      statusFilter,
      projectFilter,
      priorityFilter,
      searchQuery
    });
    
    // Always apply filters, even if allTasks is empty (to set filteredTasks to empty)
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, statusFilter, projectFilter, priorityFilter, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === 'high' || priorityLower === 'critical') {
      return 'bg-red-500/20 text-red-400';
    } else if (priorityLower === 'medium') {
      return 'bg-yellow-500/20 text-yellow-400';
    } else if (priorityLower === 'low' || priorityLower === 'easy') {
      return 'bg-green-500/20 text-green-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityLabel = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === 'high' || priorityLower === 'critical') {
      return 'Critical';
    } else if (priorityLower === 'medium') {
      return 'Medium';
    } else if (priorityLower === 'low' || priorityLower === 'easy') {
      return 'Easy';
    }
    return priority || 'Unknown';
  };

  console.log('📊 TasksPage render summary:', {
    allTasksCount: allTasks.length,
    filteredTasksCount: filteredTasks.length,
    isLoading,
    projectsCount: projects.length,
    filters: { statusFilter, projectFilter, priorityFilter, searchQuery }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">All Tasks</h2>
          <p className="text-gray-400 text-sm">View and manage tasks across all projects</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className={`px-2 py-1 rounded ${isLoading ? 'bg-yellow-500/20 text-yellow-400' : allTasks.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isLoading ? '⏳ Loading tasks...' : allTasks.length === 0 ? '❌ No tasks in database' : `✅ ${filteredTasks.length} of ${allTasks.length} tasks`}
            </span>
            {projects.length > 0 && (
              <span className="text-gray-500">
                {projects.length} project{projects.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            console.log('🔄 Manual refresh button clicked');
            setIsLoading(true);
            loadTasks();
            loadProjects();
          }}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all text-sm font-medium flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V1M8 15V13M3 8H1M15 8H13M12.364 3.636L13.778 2.222M2.222 13.778L3.636 12.364M12.364 12.364L13.778 13.778M2.222 2.222L3.636 3.636" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 12A4 4 0 108 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search by Person Name */}
          <div className="relative">
            <label className="block text-xs text-gray-400 mb-2">Search by Person</label>
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" 
                viewBox="0 0 16 16" 
                fill="none"
              >
                <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#3a3a3a] transition-colors"
              />
            </div>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Filter by Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#3a3a3a] transition-colors"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project._id || project.id} value={project._id || project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Filter by Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#3a3a3a] transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="easy">Easy</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#3a3a3a] transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || projectFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-[#1f1f1f] flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg border border-blue-500/30">
                Person: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            )}
            {projectFilter !== 'all' && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg border border-purple-500/30">
                Project: {projects.find(p => (p._id || p.id) === projectFilter)?.name || 'Unknown'}
                <button
                  onClick={() => setProjectFilter('all')}
                  className="ml-2 hover:text-purple-300"
                >
                  ×
                </button>
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg border border-yellow-500/30">
                Priority: {priorityFilter}
                <button
                  onClick={() => setPriorityFilter('all')}
                  className="ml-2 hover:text-yellow-300"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg border border-green-500/30">
                Status: {statusFilter.replace('_', ' ')}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 hover:text-green-300"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setProjectFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
              }}
              className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No tasks found</p>
          <p className="text-gray-500 text-sm mb-4">
            {allTasks.length === 0 
              ? 'Tasks will appear here once they are created in projects. Create tasks in the Projects section by chatting with AI.'
              : 'No tasks match your current filters. Try adjusting your search or filters.'}
          </p>
          {allTasks.length > 0 && (
            <p className="text-gray-500 text-xs mt-2 mb-4">
              You have {allTasks.length} task(s) but they don't match your filters.
            </p>
          )}
          <button
            onClick={() => {
              console.log('🔄 Refresh button clicked');
              loadTasks();
            }}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all text-sm font-medium"
          >
            Refresh Tasks
          </button>
          <p className="text-gray-500 text-xs mt-4">
            Check the browser console (F12) for detailed logs about task loading.
          </p>
        </div>
      ) : null}

      {!isLoading && filteredTasks.length > 0 && (
        <>
          <div className="mb-4">
            <div className="text-sm text-gray-400">
              Showing {filteredTasks.length} of {allTasks.length} tasks
            </div>
          </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id || task._id}
              className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{task.title || task.task}</h3>
                    <span className={`px-2 py-1 text-xs rounded-lg border ${getStatusColor(task.status)}`}>
                      {task.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                    {task.priority && (
                      <span className={`px-2 py-1 text-xs rounded-lg ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    )}
                  </div>
                  
                  {/* Project Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-500">
                      <rect x="3" y="4" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 4V3C5 2.5 5.5 2 6 2H10C10.5 2 11 2.5 11 3V4" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span className="text-sm text-blue-400 font-medium">
                      {task.project_name || task.project?.name || 'Unknown Project'}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-400 mb-4">{task.description}</p>
                  )}

                  {/* Task Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {task.assigned_to && task.assigned_to !== 'Unassigned' && (
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M3 13C3 11 5 9.5 8 9.5C11 9.5 13 11 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-purple-400">{task.assigned_to}</span>
                      </div>
                    )}
                    {task.role && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400">Role: {task.role}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 1V3M11 1V3M3 6H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-orange-400">
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {task.timeline && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400">⏱️ {task.timeline}</span>
                      </div>
                    )}
                    {task.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-yellow-400">{task.estimated_hours} hours</span>
                      </div>
                    )}
                    {task.created_at && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Follow-up Section */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.last_followup_at && (
                    <span className="text-xs text-gray-500">
                      Last checked: {getLastChecked(task.last_followup_at)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleFollowup(task)}
                  disabled={sendingFollowup === (task.id || task._id)}
                  className="px-3 py-1.5 text-xs bg-[#4C3BCF]/20 text-[#4C3BCF] border border-[#4C3BCF]/30 rounded-lg hover:bg-[#4C3BCF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  title="Send follow-up message"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {sendingFollowup === task.id ? 'Sending...' : 'Follow-up'}
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

// Teams Page Component
function TeamsPage({ user }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }

    setResumeFile(file);
    setIsAnalyzing(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_BASE_URL}/api/teams/analyze_resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setEmail(data.analysis.email || '');
        setSelectedRoles(data.analysis.selected_roles || []);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to analyze resume'}`);
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMember = async () => {
    if (!resumeFile || !analysis) {
      alert('Please upload and analyze a resume first');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('email', email);
      formData.append('selected_roles', JSON.stringify(selectedRoles));

      const response = await fetch(`${API_BASE_URL}/api/teams/members`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('✅ Team member added successfully!');
        setShowCreateModal(false);
        setResumeFile(null);
        setAnalysis(null);
        setEmail('');
        setSelectedRoles([]);
        loadTeamMembers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save member'}`);
      }
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadTeamMembers();
      } else {
        alert('Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete team member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Members</h2>
          <p className="text-gray-400 text-sm">Manage your team members for task assignment</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white text-black hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Create New Member</span>
        </button>
      </div>

      {/* Team Members Grid */}
      {teamMembers.length === 0 ? (
        <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No team members yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all"
          >
            Add Your First Team Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div key={member._id} className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{member.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-400">{member.role || 'Developer'}</p>
                </div>
                <button
                  onClick={() => handleDeleteMember(member._id)}
                  className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-red-400 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              
              {member.email && (
                <p className="text-sm text-gray-400 mb-3">{member.email}</p>
              )}

              {member.skills && member.skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-[#1a1a1a] text-xs rounded-lg text-gray-300">
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 5 && (
                      <span className="px-2 py-1 bg-[#1a1a1a] text-xs rounded-lg text-gray-500">
                        +{member.skills.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-[#1f1f1f]">
                <span>⏰ {member.experience_years || 0} years</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg ${
                    member.status === 'idle' ? 'bg-green-500/20 text-green-400' :
                    member.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {member.status || 'idle'}
                  </span>
                  {member.idle_percentage !== undefined && (
                    <span className={`px-2 py-1 rounded-lg font-medium ${
                      member.idle_percentage >= 50 ? 'bg-green-500/20 text-green-400' :
                      member.idle_percentage >= 25 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {member.idle_percentage.toFixed(1)}% idle
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Create New Team Member</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setResumeFile(null);
                  setAnalysis(null);
                  setEmail('');
                  setSelectedRoles([]);
                }}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Resume Upload */}
            {!analysis ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-8 text-center hover:border-[#3a3a3a] transition-all">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p className="text-sm font-medium mb-1">Upload Resume</p>
                    <p className="text-xs text-gray-400">PDF or DOCX format</p>
                  </label>
                </div>
                {isAnalyzing && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p className="text-sm text-gray-400 mt-2">Analyzing resume with AI...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-400 mb-2">✅ Resume analyzed successfully!</p>
                </div>

                {/* Analysis Results */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={analysis.name || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <input
                      type="text"
                      value={analysis.role || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                      {analysis.skills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-[#0a0a0a] text-xs rounded-lg text-gray-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Experience</label>
                    <input
                      type="text"
                      value={`${analysis.experience_years || 0} years`}
                      readOnly
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                    />
                  </div>

                  {analysis.description && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={analysis.description}
                        readOnly
                        rows="4"
                        className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Suggested Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {analysis.selected_roles?.map((role, i) => (
                        <label key={i} className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#222222] transition-all">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles([...selectedRoles, role]);
                              } else {
                                setSelectedRoles(selectedRoles.filter(r => r !== role));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-300">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                  <button
                    onClick={handleSaveMember}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Team Member'}
                  </button>
                  <button
                    onClick={() => {
                      setAnalysis(null);
                      setResumeFile(null);
                    }}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] transition-all"
                  >
                    Upload New Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoDash() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProjectsPanelOpen, setIsProjectsPanelOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard'); // dashboard, projects, tasks, analytics, team, issue-resolution
  
  // Project management
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [user, setUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [showJiraTaskModal, setShowJiraTaskModal] = useState(false);
  const [selectedTaskForJira, setSelectedTaskForJira] = useState(null);
  const [jiraProjects, setJiraProjects] = useState([]);
  const [repos, setRepos] = useState([]);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState([]);
  
  // Task approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [slackChannels, setSlackChannels] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({}); // {taskId: {assigned_member_name, assigned_member_email}}
  
  // Issue Resolution state
  const [issueQuestion, setIssueQuestion] = useState('');
  const [issueChannel, setIssueChannel] = useState('');
  const [isAnalyzingIssue, setIsAnalyzingIssue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLogs, setRefreshLogs] = useState([]);
  const [channelMessages, setChannelMessages] = useState([]);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
  const [autoFetchStatus, setAutoFetchStatus] = useState('idle'); // idle, scanning, processing
  const [lastScanTime, setLastScanTime] = useState(null);
  const [totalMentionsFound, setTotalMentionsFound] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [processedMentionIds, setProcessedMentionIds] = useState(new Set()); // Track processed mentions by channel+ts
  const [isFirstFetch, setIsFirstFetch] = useState(true);
  const processedMentionIdsRef = useRef(new Set()); // Ref to avoid dependency issues

  // Auto-assign best member when tasks are loaded
  useEffect(() => {
    if (pendingTasks.length > 0) {
      setTaskAssignments(prev => {
        const newAssignments = { ...prev };
        let hasChanges = false;
        
        pendingTasks.forEach(task => {
          if (task.suggested_members && task.suggested_members.length > 0 && !newAssignments[task.id]) {
            const bestMember = task.suggested_members[0]; // Highest score
            newAssignments[task.id] = {
              assigned_member_name: bestMember.name,
              assigned_member_email: bestMember.email
            };
            hasChanges = true;
          }
        });
        
        return hasChanges ? newAssignments : prev;
      });
    }
  }, [pendingTasks]);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  useEffect(() => {
    checkAuth();
    
    // Check for GitHub connection success
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      alert('✅ GitHub connected successfully!');
      checkGithubConnection();
      window.history.replaceState({}, '', '/demodash');
    }
    if (params.get('slack_connected') === 'true') {
      alert('✅ Slack connected successfully!');
      checkSlackConnection();
      window.history.replaceState({}, '', '/demodash');
    }
  }, []);

  // Load dashboard data - Enabled for Team Performance live data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Set user name
      if (user?.name) {
        setUserName(user.name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }

      // Load projects
      const projectsRes = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const userProjects = projectsData.projects || [];
        setDashboardProjects(userProjects.slice(0, 10)); // Show first 10
        setDashboardStats(prev => ({ ...prev, activeProjects: userProjects.length }));
        
        // Load tasks for each project
        const tasksMap = {};
        for (const project of userProjects.slice(0, 10)) {
          const projectId = project._id || project.id;
          try {
            const tasksRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (tasksRes.ok) {
              const tasksData = await tasksRes.json();
              tasksMap[projectId] = tasksData.tasks || [];
            }
          } catch (e) {
            console.error(`Error loading tasks for project ${projectId}:`, e);
            tasksMap[projectId] = [];
          }
        }
        setProjectTasks(tasksMap);
      }

      // Load team members
      const membersRes = await fetch(`${API_BASE_URL}/api/teams/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const members = membersData.members || [];
        setDashboardStats(prev => ({ ...prev, members: members.length }));
      }

      // Load all tasks across all projects to calculate stats
      const allTasks = [];
      const projectsRes2 = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projectsRes2.ok) {
        const projectsData2 = await projectsRes2.json();
        const userProjects2 = projectsData2.projects || [];
        
        for (const project of userProjects2) {
          const projectId = project._id || project.id;
          try {
            const tasksRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (tasksRes.ok) {
              const tasksData = await tasksRes.json();
              allTasks.push(...(tasksData.tasks || []));
            }
          } catch (e) {
            console.error(`Error loading tasks for project ${projectId}:`, e);
          }
        }

        // Calculate task statistics
        const completedTasks = allTasks.filter(t => t.status === 'completed' || t.status === 'done' || t.status === 'sent_to_slack').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress' || t.status === 'approved').length;
        const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'pending_approval').length;
        const priorityTasks = allTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;

        const totalTasks = allTasks.length;
        const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
        const pendingPercent = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

        setDashboardStats(prev => ({
          ...prev,
          priorityTasks: priorityTasks,
          tasksCompleted: completedTasks
        }));

        setPieChartData({
          completed: completedPercent,
          inProgress: inProgressPercent,
          pending: pendingPercent
        });

        // Store actual task counts for Team Performance section (LIVE DATA)
        const performanceData = {
          completedCount: completedTasks,
          inProgressCount: inProgressTasks,
          pendingCount: pendingTasks,
          totalCount: totalTasks
        };
        console.log('📊 Team Performance Data (LIVE):', performanceData);
        console.log('📊 All Tasks:', allTasks.length, allTasks);
        setTeamPerformanceData(performanceData);

        // NOTE: Keeping dummy data for Recent Activities and Pending Tasks
        // Only Team Performance section uses live data from API
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
      loadProjects();
      checkGithubConnection();
      checkSlackConnection();
      checkJiraConnection();
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const checkGithubConnection = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/github/api/check_connection`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('GitHub status:', data);
      setGithubConnected(data.connected);
      if (data.connected) {
        fetchRepos();
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    }
  };

  const fetchRepos = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/github/api/repos`, {
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

  const connectGithub = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first");
      return;
    }
    window.location.href = `${API_BASE_URL}/github/install?token=${token}`;
  };

  const checkSlackConnection = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/slack/api/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Slack status:', data);
      setSlackConnected(data.connected);
    } catch (error) {
      console.error('Error checking Slack connection:', error);
    }
  };

  const connectSlack = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first");
      return;
    }
    window.location.href = `${API_BASE_URL}/slack/install?token=${token}`;
  };

  const checkJiraConnection = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/jira/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setJiraConnected(data.connected);
    } catch (error) {
      console.error('Error checking Jira connection:', error);
    }
  };

  const connectReposToProject = async () => {
    if (!selectedProject || selectedRepos.length === 0) return;
    
    const token = localStorage.getItem('token');
    try {
      console.log('🔄 Connecting repositories:', selectedRepos);
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          repos: selectedRepos,
          repo: selectedRepos[0] // Keep backward compatibility
        })
      });
      
      if (response.ok) {
        console.log(`✅ ${selectedRepos.length} repositories connected to project`);
        await loadProjects();
        // Update the selected project immediately
        const updatedProject = { ...selectedProject, repos: selectedRepos, repo: selectedRepos[0] };
        console.log('📦 Updated project:', updatedProject);
        setSelectedProject(updatedProject);
        setShowRepoModal(false);
        setSelectedRepos([]);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to connect repositories:', errorData);
        alert('Failed to connect repositories');
      }
    } catch (error) {
      console.error('Error connecting repos:', error);
      alert('Error connecting repositories');
    }
  };

  const toggleRepoSelection = (repo) => {
    setSelectedRepos(prev => {
      const isSelected = prev.some(r => r.id === repo.id);
      if (isSelected) {
        return prev.filter(r => r.id !== repo.id);
      } else {
        // Add type detection based on repo name/description
        const repoWithType = {
          ...repo,
          type: detectRepoType(repo)
        };
        return [...prev, repoWithType];
      }
    });
  };

  // Load Slack channels for issue resolution
  useEffect(() => {
    if (activePage === 'issue-resolution' && slackConnected) {
      const loadChannels = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const channelsRes = await fetch(`${API_BASE_URL}/slack/api/list_conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (channelsRes.ok) {
            const channelsData = await channelsRes.json();
            setSlackChannels(channelsData.channels || []);
          }
        } catch (error) {
          console.error('Failed to load Slack channels:', error);
        }
      };
      loadChannels();
    }
  }, [activePage, slackConnected]);

  // Auto-fetch mentions from all channels: once immediately, then every minute
  useEffect(() => {
    if (!autoFetchEnabled || !slackConnected || activePage !== 'issue-resolution') {
      setIsFirstFetch(true);
      // Reset processed mentions when auto-fetch is disabled
      if (!autoFetchEnabled) {
        processedMentionIdsRef.current = new Set();
        setProcessedMentionIds(new Set());
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    let intervalId;
    let timeoutId;
    let isProcessing = false;

    const autoFetchMentions = async () => {
      // Skip if already processing
      if (isProcessing) {
        return;
      }

      isProcessing = true;
      setAutoFetchStatus('scanning');
      setLastScanTime(new Date().toLocaleTimeString());

      try {
        // Get all channels
        const channelsRes = await fetch(`${API_BASE_URL}/slack/api/list_conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!channelsRes.ok) {
          setAutoFetchStatus('idle');
          isProcessing = false;
          return;
        }

        const channelsData = await channelsRes.json();
        const channels = channelsData.channels || [];

        if (channels.length === 0) {
          setAutoFetchStatus('idle');
          isProcessing = false;
          return;
        }

        // Check each channel for mentions
        let newMentionsCount = 0;
        let newProcessedCount = 0;

        for (const channel of channels) {
          try {
            const response = await fetch(`${API_BASE_URL}/slack/api/check-channel-mentions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: channel.id,
                project_id: selectedProject ? (selectedProject._id || selectedProject.id) : null,
                auto_fetch: true,
                processed_mention_ids: Array.from(processedMentionIdsRef.current) // Send already processed IDs
              })
            });

            if (response.ok) {
              const data = await response.json();
              const mentions = data.mentions || [];
              
              // Filter out already processed mentions
              const newMentions = mentions.filter(mention => {
                const mentionId = `${channel.id}_${mention.ts}`;
                return !processedMentionIdsRef.current.has(mentionId);
              });

              if (newMentions.length > 0) {
                newMentionsCount += newMentions.length;
                
                // Mark these mentions as processed
                const newIds = newMentions.map(mention => `${channel.id}_${mention.ts}`);
                newIds.forEach(id => processedMentionIdsRef.current.add(id));
                // Also update state for UI (optional, but keeps it in sync)
                setProcessedMentionIds(new Set(processedMentionIdsRef.current));

                // Log new mentions found
                setRefreshLogs(prev => [...prev, {
                  type: 'info',
                  message: `🔍 Scanning #${channel.name}...`,
                  timestamp: new Date().toLocaleTimeString()
                }, {
                  type: 'success',
                  message: `🔔 Found ${newMentions.length} new @Feeta mention(s) in #${channel.name}`,
                  timestamp: new Date().toLocaleTimeString()
                }]);
                
                // Add details about each new mention
                newMentions.forEach((mention) => {
                  setRefreshLogs(prev => [...prev, {
                    type: 'info',
                    message: `  → ${mention.user_name || 'User'}: "${mention.question || mention.text || 'No question'}"`,
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                });
              }

              // Count processed mentions (from backend response)
              const processedCount = data.processed_count || 0;
              newProcessedCount += processedCount;
              
              if (processedCount > 0 && newMentions.length > 0) {
                setRefreshLogs(prev => [...prev, {
                  type: 'success',
                  message: `✅ Processed ${processedCount} mention(s) from #${channel.name} - Solutions sent to Slack!`,
                  timestamp: new Date().toLocaleTimeString()
                }]);
              }
            }
          } catch (error) {
            // Silently skip errors for individual channels
            console.error(`Error checking channel ${channel.name}:`, error);
          }
        }

        // Only update counters for new mentions
        if (newMentionsCount > 0) {
          setTotalMentionsFound(prev => prev + newMentionsCount);
          setTotalProcessed(prev => prev + newProcessedCount);

          setAutoFetchStatus('processing');
          setTimeout(() => setAutoFetchStatus('idle'), 500);
        } else {
          setAutoFetchStatus('idle');
        }
      } catch (error) {
        console.error('Auto-fetch error:', error);
        setAutoFetchStatus('idle');
      } finally {
        isProcessing = false;
        setIsFirstFetch(false);
      }
    };

    // Run immediately on first fetch
    autoFetchMentions();
    
    // Then set interval to 1 minute (60000ms) after first fetch
    timeoutId = setTimeout(() => {
      intervalId = setInterval(autoFetchMentions, 60000); // Every minute
    }, 1000); // Wait 1 second after first fetch before setting interval

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [autoFetchEnabled, slackConnected, activePage, selectedProject]);

  const handleIssueResolution = async () => {
    if (!issueQuestion.trim()) {
      alert('Please enter your question');
      return;
    }

    if (!issueChannel) {
      alert('Please select a Slack channel');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setIsAnalyzingIssue(true);

    try {
      let response;
      if (selectedProject) {
        // Use project-specific endpoint if project is selected
        response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject._id || selectedProject.id}/resolve-issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: issueQuestion,
            channel: issueChannel
          })
        });
      } else {
        // Use general endpoint if no project selected
        response = await fetch(`${API_BASE_URL}/slack/api/resolve-issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: issueQuestion,
            channel: issueChannel
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        alert('✅ Issue analyzed and solution sent to Slack!');
        setIssueQuestion('');
        setIssueChannel('');
      } else {
        const errorData = await response.json();
        alert(`Failed to resolve issue: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
      alert('Error resolving issue. Please try again.');
    } finally {
      setIsAnalyzingIssue(false);
    }
  };

  const handleRefreshChannel = async () => {
    if (!issueChannel) {
      alert('Please select a Slack channel first');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setIsRefreshing(true);
    setRefreshLogs([]);
    setChannelMessages([]);

    try {
      // Add initial log
      setRefreshLogs(prev => [...prev, {
        type: 'info',
        message: 'Starting channel scan...',
        timestamp: new Date().toLocaleTimeString()
      }]);

      const response = await fetch(`${API_BASE_URL}/slack/api/check-channel-mentions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: issueChannel,
          project_id: selectedProject ? (selectedProject._id || selectedProject.id) : null
        })
      }).catch((fetchError) => {
        // Handle network errors
        let errorMsg = 'Network connection failed';
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          errorMsg = 'Cannot connect to backend server. Please ensure:\n1. Backend server is running on ${API_BASE_URL}\n2. No firewall is blocking the connection';
        } else {
          errorMsg = fetchError.message;
        }
        setRefreshLogs(prev => [...prev, {
          type: 'error',
          message: `❌ Network Error: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        throw fetchError;
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add logs from response
        if (data.logs) {
          setRefreshLogs(prev => [...prev, ...data.logs]);
        }
        
        // Set channel messages if provided
        if (data.messages) {
          setChannelMessages(data.messages);
        }
        
        // Add summary log
        const processedCount = data.processed_count || 0;
        const mentionsFound = data.mentions_found || 0;
        
        setRefreshLogs(prev => [...prev, {
          type: 'success',
          message: `Scan complete! Found ${mentionsFound} mention(s), processed ${processedCount} successfully.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        
        if (processedCount > 0) {
          setRefreshLogs(prev => [...prev, {
            type: 'success',
            message: `✅ Solutions sent to ${processedCount} user(s) in Slack!`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        } else if (mentionsFound === 0) {
          setRefreshLogs(prev => [...prev, {
            type: 'info',
            message: 'ℹ️ No @Feeta mentions found in the last 100 messages.',
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setRefreshLogs(prev => [...prev, {
          type: 'error',
          message: `❌ Error: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error('Error refreshing channel:', error);
      // Only add error log if it wasn't already added in the catch above
      if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
        setRefreshLogs(prev => [...prev, {
          type: 'error',
          message: `❌ Error: ${error.message || 'Failed to refresh channel. Please check your connection and ensure the backend server is running.'}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const showPendingTasksApproval = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    if (!projectId) {
      alert('No project selected');
      return;
    }

    try {
      console.log(`📋 Loading pending tasks for project: ${projectId}`);
      
      // Fetch pending tasks with suggestions
      const tasksRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks/pending-approval`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📋 Response status: ${tasksRes.status}`);
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        console.log(`✅ Loaded ${tasksData.tasks?.length || 0} pending tasks`);
        setPendingTasks(tasksData.tasks || []);
        
        // Fetch Slack channels (optional - don't fail if this fails)
        try {
          const channelsRes = await fetch(`${API_BASE_URL}/slack/api/list_conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (channelsRes.ok) {
            const channelsData = await channelsRes.json();
            setSlackChannels(channelsData.channels || []);
          }
        } catch (channelError) {
          console.warn('Failed to load Slack channels:', channelError);
          // Continue without channels
        }
        
        setShowApprovalModal(true);
      } else {
        let errorMsg = `HTTP ${tasksRes.status}`;
        try {
          const errorData = await tasksRes.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = `${errorMsg}: ${tasksRes.statusText}`;
        }
        console.error('❌ Failed to load pending tasks:', errorMsg);
        alert(`Failed to load pending tasks: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Error loading pending tasks:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Network error: Could not connect to server. Please check if the backend is running.');
      } else {
        alert(`Error loading pending tasks: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleApproveTasks = async () => {
    if (!selectedProject) {
      alert('No project selected');
      return;
    }
    
    const taskIds = pendingTasks.map(t => t.id || t._id).filter(id => id);
    if (taskIds.length === 0) {
      alert('No tasks to approve');
      return;
    }

    // If Slack is connected, channel is required
    if (slackConnected && !selectedChannel) {
      alert('Please select a Slack channel to send tasks');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      console.log(`✅ Approving ${taskIds.length} tasks...`);
      
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject._id || selectedProject.id}/tasks/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_ids: taskIds,
          channel_id: selectedChannel || null,
          task_assignments: taskAssignments
        })
      });

      if (response.ok) {
        const data = await response.json();
        const message = slackConnected && selectedChannel 
          ? `✅ ${data.approved_count} tasks approved and sent to Slack!`
          : `✅ ${data.approved_count} tasks approved${slackConnected ? ' (Slack not configured)' : ''}`;
        alert(message);
        setShowApprovalModal(false);
        setPendingTasks([]);
        setTaskAssignments({});
        setSelectedChannel('');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Error: ${error.error || 'Failed to approve tasks'}`);
      }
    } catch (error) {
      console.error('Error approving tasks:', error);
      alert(`Failed to approve tasks: ${error.message || 'Network error'}`);
    }
  };

  const detectRepoType = (repo) => {
    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();
    
    // Frontend indicators
    if (name.includes('frontend') || name.includes('client') || name.includes('ui') || 
        desc.includes('react') || desc.includes('vue') || desc.includes('angular') ||
        desc.includes('frontend') || desc.includes('client')) {
      return 'frontend';
    }
    
    // Backend indicators
    if (name.includes('backend') || name.includes('server') || name.includes('api') ||
        desc.includes('backend') || desc.includes('server') || desc.includes('api') ||
        desc.includes('express') || desc.includes('flask') || desc.includes('django')) {
      return 'backend';
    }
    
    // Full-stack indicators
    if (name.includes('fullstack') || name.includes('full-stack') ||
        desc.includes('fullstack') || desc.includes('full-stack')) {
      return 'fullstack';
    }
    
    return 'unknown';
  };

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
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
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
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
        setNewProjectName('');
        setShowCreateModal(false);
        await loadProjects();
        setSelectedProject(data.project);
        setMessages([]);
        setSessionId(null);
        // Open projects panel in sidebar
        if (!isProjectsPanelOpen) {
          toggleProjectsPanel();
        }
      } else {
        alert('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const toggleProjectsPanel = () => {
    setIsProjectsPanelOpen(!isProjectsPanelOpen);
    setSidebarCollapsed(!sidebarCollapsed);
    setActivePage('projects');
  };

  const handleMenuItemClick = (page) => {
    console.log('🖱️ Menu item clicked:', page);
    console.log('📍 Before state change:', { 
      currentActivePage: activePage, 
      newPage: page,
      sidebarCollapsed,
      isProjectsPanelOpen 
    });
    
    // When clicking other menu items, expand sidebar and close projects panel
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
    if (isProjectsPanelOpen) {
      setIsProjectsPanelOpen(false);
    }
    setActivePage(page);
    
    console.log('✅ Active page set to:', page);
    if (page === 'tasks') {
      console.log('📋 Tasks page selected - TasksPage component should render now');
      console.log('🔄 Tasks page will reload tasks when component mounts');
    }
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    setMessages([]);
    setSessionId(null);
    
    // Track project access time for recent projects sorting
    const projectId = project._id || project.id;
    if (projectId) {
      const accessData = JSON.parse(localStorage.getItem('projectAccessTimes') || '{}');
      accessData[projectId] = new Date().toISOString();
      localStorage.setItem('projectAccessTimes', JSON.stringify(accessData));
    }
    
    // Load project messages if any
    loadProjectMessages(project);
  };

  const loadProjectMessages = async (project) => {
    const token = localStorage.getItem('token');
    if (!token || !project) return;
    
    try {
      const projectId = project._id || project.id;
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Reconstruct message structure to match expected format
        const reconstructedMessages = (data.messages || []).map(msg => {
          const reconstructed = { ...msg };
          // Extract plan and questions from data field
          if (msg.data) {
            if (msg.data.plan) {
              reconstructed.plan = msg.data.plan;
            }
            if (msg.data.questions) {
              reconstructed.questions = msg.data.questions;
            }
          }
          return reconstructed;
        });
        setMessages(reconstructedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Save user message to database
    if (selectedProject) {
      const token = localStorage.getItem('token');
      const projectId = selectedProject._id || selectedProject.id;
      
      try {
        await fetch(`${API_BASE_URL}/api/projects/${projectId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: 'user',
            content: currentInput
          })
        });
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    try {
      // Support multiple repositories
      let repositories = [];
      if (selectedProject?.repos && selectedProject.repos.length > 0) {
        repositories = selectedProject.repos.map(repo => {
          const [owner, repoName] = repo?.full_name?.split('/') || [];
          return { owner, repo: repoName, type: repo.type || 'unknown' };
        });
      } else if (selectedProject?.repo?.full_name) {
        // Fallback to single repo for backward compatibility
        const [owner, repoName] = selectedProject.repo.full_name.split('/');
        repositories = [{ owner, repo: repoName, type: 'unknown' }];
      }
      
      const res = await fetch("${API_BASE_URL}/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: currentInput,
          session_id: sessionId,
          repositories,
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
        const token = localStorage.getItem('token');
        const planRes = await fetch("${API_BASE_URL}/api/generate_plan", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            task: currentInput,
            session_id: data.session_id,
            answers: {}
          }),
        });

        const planData = await planRes.json();
        
        if (planRes.ok && !planData.error) {
          aiResponse.content = `I've analyzed your request: "${currentInput}"\n\nI've created an implementation plan with ${planData.subtasks?.length} subtasks.`;
          aiResponse.plan = planData;

          // Save tasks to database
          if (selectedProject && planData.subtasks) {
            try {
              await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  subtasks: planData.subtasks,
                  session_id: data.session_id
                })
              });
              console.log(`✅ ${planData.subtasks.length} tasks saved to database`);
            } catch (taskError) {
              console.error("Error saving tasks:", taskError);
            }
          }
        }
      } else if (data.status === "ambiguous") {
        aiResponse.content = "I need some clarification before proceeding:";
        aiResponse.questions = data.questions;
        aiResponse.needsAnswers = true;
        aiResponse.originalTask = currentInput;
      }

      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);

      // Save AI response to database
      if (selectedProject) {
        const token = localStorage.getItem('token');
        const projectId = selectedProject._id || selectedProject.id;
        
        try {
          await fetch(`${API_BASE_URL}/api/projects/${projectId}/messages`, {
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

    let originalTask = message.originalTask || '';
    
    if (!originalTask) {
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          originalTask = messages[i].content;
          break;
        }
      }
    }

    if (!originalTask) {
      alert("Error: Could not find the original task. Please try again.");
      setIsLoading(false);
      return;
    }

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

      const token = localStorage.getItem('token');
      const planRes = await fetch("${API_BASE_URL}/api/generate_plan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      const planData = await planRes.json();
      
      if (planRes.ok && !planData.error) {
        const aiResponse = {
          role: 'assistant',
          content: `Thanks for the clarification! I've created a detailed plan with ${planData.subtasks?.length} subtasks.`,
          timestamp: new Date().toISOString(),
          plan: planData
        };

        const updatedMessages = [...messages];
        updatedMessages[messageIndex].answered = true;
        updatedMessages.push(aiResponse);
        setMessages(updatedMessages);

        // Save to database
        if (selectedProject) {
          const token = localStorage.getItem('token');
          const projectId = selectedProject._id || selectedProject.id;
          
          try {
            // Save AI response message
            await fetch(`${API_BASE_URL}/api/projects/${projectId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                role: 'assistant',
                content: aiResponse.content,
                data: { plan: aiResponse.plan }
              })
            });

            // Save tasks to database
            if (planData.subtasks) {
              await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  subtasks: planData.subtasks,
                  session_id: sessionId
                })
              });
              console.log(`✅ ${planData.subtasks.length} tasks saved to database`);
            }
          } catch (error) {
            console.error("Error saving AI response or tasks:", error);
          }
        }
      } else {
        throw new Error(planData.error || "Failed to generate plan");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }

    setIsLoading(false);
  };

  // Question Form Component
  const QuestionForm = ({ questions, onSubmit, messageIndex }) => {
    const [answers, setAnswers] = useState({});

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(answers);
    };

    return (
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {q.question}
            </label>
            <input
              type="text"
              value={answers[`q${i}`] || ''}
              onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#4C3BCF] transition-colors text-sm"
              placeholder="Your answer..."
              required
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-lg transition-all font-medium text-sm"
        >
          Submit Answers
        </button>
      </form>
    );
  };

  // Custom scrollbar styles and performance optimizations
  const scrollbarStyles = `
    .sidebar-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar-scroll::-webkit-scrollbar-track {
      background: #111111;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: #2a2a2a;
      border-radius: 3px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: #333333;
    }
    .main-scroll::-webkit-scrollbar {
      width: 8px;
    }
    .main-scroll::-webkit-scrollbar-track {
      background: #0a0a0a;
    }
    .main-scroll::-webkit-scrollbar-thumb {
      background: #1f1f1f;
      border-radius: 4px;
    }
    .main-scroll::-webkit-scrollbar-thumb:hover {
      background: #2a2a2a;
    }
    
    /* Performance optimizations */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .smooth-scroll {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Blurry background effects */
    .blur-orb-1 {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(76, 59, 207, 0.15) 0%, rgba(76, 59, 207, 0) 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
      top: -200px;
      left: -200px;
      animation: float 20s ease-in-out infinite;
    }
    
    .blur-orb-2 {
      position: fixed;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, rgba(147, 51, 234, 0) 70%);
      filter: blur(70px);
      pointer-events: none;
      z-index: 0;
      top: 40%;
      right: -150px;
      animation: float 18s ease-in-out infinite reverse;
    }
    
    .blur-orb-3 {
      position: fixed;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 70%);
      filter: blur(60px);
      pointer-events: none;
      z-index: 0;
      bottom: 10%;
      left: 30%;
      animation: float 22s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -30px) scale(1.05);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.95);
      }
    }
    
    /* GPU acceleration for smoother animations */
    .gpu-accelerate {
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #0a0a0a;
      border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #4C3BCF;
      border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #6B5CE6;
    }
  `;

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 12,
    priorityTasks: 18,
    tasksCompleted: 24,
    members: 8
  });
  const [dashboardActivities, setDashboardActivities] = useState([
    { time: '15m ago', user: 'Syed Ateef Quadri', action: 'completed user authentication module' },
    { time: '45m ago', user: 'Md Suhail', action: 'finished API integration testing' },
    { time: '1h ago', user: 'Syed Ateef Quadri', action: 'deployed new feature to staging' },
    { time: '2h ago', user: 'Md Suhail', action: 'merged pull request #142' },
    { time: '3h ago', user: 'Syed Ateef Quadri', action: 'optimized database queries' },
    { time: '4h ago', user: 'Md Suhail', action: 'fixed critical security vulnerability' },
    { time: '5h ago', user: 'Syed Ateef Quadri', action: 'implemented real-time notifications' },
    { time: '6h ago', user: 'Md Suhail', action: 'updated user interface components' },
    { time: '1d ago', user: 'Syed Ateef Quadri', action: 'completed backend API refactoring' },
    { time: '1d ago', user: 'Md Suhail', action: 'added new dashboard analytics features' },
    { time: '2d ago', user: 'Syed Ateef Quadri', action: 'resolved performance bottlenecks' },
    { time: '2d ago', user: 'Md Suhail', action: 'integrated third-party payment gateway' }
  ]);
  const [pendingTasksForDisplay, setPendingTasksForDisplay] = useState([
    {
      id: 'demo-1',
      time: '20m ago',
      user: 'Syed Ateef Quadri',
      action: 'Implement user dashboard analytics',
      description: 'Add real-time analytics charts and data visualization components to the user dashboard with interactive graphs',
      status: 'pending_approval',
      priority: 'high'
    },
    {
      id: 'demo-2',
      time: '45m ago',
      user: 'Md Suhail',
      action: 'Fix authentication bug in login flow',
      description: 'Resolve issue with token expiration handling in the authentication middleware and improve session management',
      status: 'pending',
      priority: 'urgent'
    },
    {
      id: 'demo-3',
      time: '1h ago',
      user: 'Syed Ateef Quadri',
      action: 'Update API documentation',
      description: 'Document new endpoints and update existing API reference documentation with code examples',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'demo-4',
      time: '2h ago',
      user: 'Md Suhail',
      action: 'Optimize database queries',
      description: 'Review and optimize slow database queries for better performance and add proper indexing',
      status: 'pending_approval',
      priority: 'high'
    },
    {
      id: 'demo-5',
      time: '3h ago',
      user: 'Syed Ateef Quadri',
      action: 'Design new notification system',
      description: 'Create a comprehensive notification system with real-time updates and user preferences',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'demo-6',
      time: '4h ago',
      user: 'Md Suhail',
      action: 'Implement file upload feature',
      description: 'Add secure file upload functionality with progress tracking and validation',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'demo-7',
      time: '5h ago',
      user: 'Syed Ateef Quadri',
      action: 'Refactor user profile component',
      description: 'Improve user profile component with better UI/UX and add profile picture upload',
      status: 'pending_approval',
      priority: 'medium'
    },
    {
      id: 'demo-8',
      time: '6h ago',
      user: 'Md Suhail',
      action: 'Add email notification service',
      description: 'Integrate email service for sending notifications and alerts to users',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'demo-9',
      time: '7h ago',
      user: 'Syed Ateef Quadri',
      action: 'Create user onboarding flow',
      description: 'Build an interactive onboarding experience for new users with step-by-step tutorials',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'demo-10',
      time: '8h ago',
      user: 'Md Suhail',
      action: 'Implement search functionality',
      description: 'Add advanced search with filters, sorting, and autocomplete for better user experience',
      status: 'pending_approval',
      priority: 'high'
    },
    {
      id: 'demo-11',
      time: '1d ago',
      user: 'Syed Ateef Quadri',
      action: 'Set up CI/CD pipeline',
      description: 'Configure continuous integration and deployment pipeline for automated testing and releases',
      status: 'pending',
      priority: 'urgent'
    },
    {
      id: 'demo-12',
      time: '1d ago',
      user: 'Md Suhail',
      action: 'Add dark mode support',
      description: 'Implement dark mode theme with user preference toggle and system detection',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'demo-13',
      time: '2d ago',
      user: 'Syed Ateef Quadri',
      action: 'Build mobile responsive layout',
      description: 'Ensure all components are fully responsive and optimized for mobile devices',
      status: 'pending_approval',
      priority: 'high'
    },
    {
      id: 'demo-14',
      time: '2d ago',
      user: 'Md Suhail',
      action: 'Integrate payment gateway',
      description: 'Add secure payment processing with multiple payment methods and subscription management',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'demo-15',
      time: '3d ago',
      user: 'Syed Ateef Quadri',
      action: 'Create admin dashboard',
      description: 'Build comprehensive admin panel with user management, analytics, and system controls',
      status: 'pending',
      priority: 'medium'
    }
  ]);
  const [dashboardProjects, setDashboardProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState({}); // {projectId: [{title, status, ...}]}
  const [pieChartData, setPieChartData] = useState({
    completed: 65,
    inProgress: 25,
    pending: 10
  });
  const [teamPerformanceData, setTeamPerformanceData] = useState({
    completedCount: 24,
    inProgressCount: 12,
    pendingCount: 15,
    totalCount: 51
  });
  const [userName, setUserName] = useState('User');

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'CustomFont';
          src: url('/fonts/_Xms-HUzqDCFdgfMm4S9DQ.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'CustomFont';
          src: url('/fonts/vQyevYAyHtARFwPqUzQGpnDs.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: 'CustomFont';
          src: url('/fonts/7AHDUZ4A7LFLVFUIFSARGIWCRQJHISQP.woff2') format('woff2');
          font-weight: 900;
          font-style: normal;
        }
      `}</style>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="flex h-screen bg-[#0a0a0a] text-white relative" style={{ fontFamily: 'CustomFont, sans-serif' }}>
        {/* Animated Blur Orbs Background */}
        <div className="blur-orb-1"></div>
        <div className="blur-orb-2"></div>
        <div className="blur-orb-3"></div>
        
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-60'} bg-[#111111]/90 backdrop-blur-sm border-r border-[#1f1f1f] flex flex-col h-screen overflow-hidden relative z-20 transition-all duration-300 ease-in-out`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'px-3 justify-center' : 'px-5'} py-6 border-b border-[#1f1f1f] bg-[#111111]`}>
          <Image 
            src="/Images/F2.png" 
            alt="Feeta Logo" 
            width={32} 
            height={32} 
            className="rounded-md flex-shrink-0"
          />
          {!sidebarCollapsed && (
            <>
              <div className="text-2xl font-extrabold">Feeta AI</div>
              <button className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Search & Menu */}
        <div className={`${sidebarCollapsed ? 'px-3' : 'px-4'} py-4 space-y-1 bg-[#111111]`}>
          {sidebarCollapsed ? (
            <>
              <button className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              <button className="w-full flex items-center justify-center p-2 text-[#4C3BCF] hover:text-[#6B5CE6] hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>

              <button className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>

              <button className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors relative">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M13 8L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </>
          ) : (
            <>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4C3BCF] hover:text-[#6B5CE6] hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>AI Agent</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M13 8L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Notifications</span>
            <span className="ml-auto bg-[#1f1f1f] text-gray-400 text-xs px-1.5 py-0.5 rounded">5</span>
          </button>
            </>
        )}
        </div>

        <div className="h-px bg-[#1f1f1f] mx-4 my-2"></div>

        {/* Main Menu */}
        <div className={`sidebar-scroll ${sidebarCollapsed ? 'px-3' : 'px-4'} py-2 space-y-1 flex-1 bg-[#111111] overflow-y-auto`}>
          <button 
            onClick={() => handleMenuItemClick('dashboard')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'dashboard' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button 
            onClick={toggleProjectsPanel}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'projects' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="3" y="4" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 4V3C5 2.5 5.5 2 6 2H10C10.5 2 11 2.5 11 3V4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {!sidebarCollapsed && <span>Projects</span>}
          </button>

          <button 
            onClick={() => handleMenuItemClick('tasks')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'tasks' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 7L7.5 8.5L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!sidebarCollapsed && <span>Tasks</span>}
          </button>

          <button 
            onClick={() => handleMenuItemClick('analytics')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'analytics' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 6H10M6 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {!sidebarCollapsed && <span>Analytics</span>}
          </button>

          <button 
            onClick={() => handleMenuItemClick('teams')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'teams' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 13C3 11 5 9.5 8 9.5C11 9.5 13 11 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {!sidebarCollapsed && <span>Team</span>}
          </button>

          <button 
            onClick={() => handleMenuItemClick('issue-resolution')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm ${activePage === 'issue-resolution' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-all`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
            </svg>
            {!sidebarCollapsed && <span>Issue Resolution</span>}
          </button>

          {!sidebarCollapsed && (
          <div className="pt-3 bg-[#111111]">
            <p className="text-xs text-gray-500 px-3 pb-2">Recents</p>
            <button 
              onClick={() => handleMenuItemClick('recent-projects')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${activePage === 'recent-projects' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white'} hover:bg-[#1a1a1a] rounded-lg transition-colors`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Recent Projects</span>
            </button>
            <button 
              onClick={() => handleMenuItemClick('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Project Hero</span>
            </button>
            <button 
              onClick={() => handleMenuItemClick('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Website revamp</span>
            </button>
          </div>
          )}
        </div>

        {/* Bottom */}
        <div className={`border-t border-[#1f1f1f] ${sidebarCollapsed ? 'p-3' : 'p-4'} space-y-1 bg-[#111111]`}>
          {!sidebarCollapsed ? (
            <>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Help center</span>
              </button>

              <div className="flex items-center gap-3 px-3 py-3 mt-2 hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(() => {
                    const displayName = userName || user?.name || user?.email?.split('@')[0] || 'User';
                    return displayName.charAt(0).toUpperCase();
                  })()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{userName || user?.name || user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-500">Pro</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Logout"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11 4L14 7M14 7L11 10M14 7H6M9 13H4C3.5 13 3 12.5 3 12V4C3 3.5 3.5 3 4 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform">
                A
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Panel */}
      {isProjectsPanelOpen && (
        <div 
          className="fixed top-0 h-screen w-64 bg-[#0f0f0f]/95 backdrop-blur-xl border-l border-[#2a2a2a] shadow-2xl transition-all duration-300 ease-in-out"
          style={{ 
            left: sidebarCollapsed ? '5rem' : '15rem',
            zIndex: 50
          }}
      >
        <div className="flex flex-col h-full">
          {/* Sub-Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a2a] bg-[#0a0a0a]/50">
            <h2 className="text-lg font-bold text-white">Projects</h2>
            <button 
              onClick={toggleProjectsPanel}
              className="p-2.5 text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all hover:scale-110 active:scale-95"
              title="Close Projects"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* New Project Button */}
          <div className="px-5 py-4 border-b border-[#2a2a2a] bg-[#0a0a0a]/30">
            <button 
              onClick={() => {
                if (!isProjectsPanelOpen) {
                  toggleProjectsPanel();
                }
                setShowCreateModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-xl text-white text-sm font-semibold transition-all shadow-lg shadow-[#4C3BCF]/30 hover:shadow-[#4C3BCF]/50 hover:scale-[1.02] active:scale-[0.98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Project
              </button>
            </div>

          {/* Projects List */}
          <div className="sidebar-scroll flex-1 overflow-y-auto px-5 py-4">
            <p className="text-xs text-gray-400 px-2 mb-3 uppercase tracking-wider font-semibold">All Projects</p>
            {projects.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="text-gray-500">
                    <rect x="3" y="4" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 4V3C5 2.5 5.5 2 6 2H10C10.5 2 11 2.5 11 3V4" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">No projects yet</p>
                <p className="text-xs text-gray-500 mt-1">Click "New Project" to create one</p>
                  </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  // Sort projects by most recently accessed
                  const accessData = JSON.parse(localStorage.getItem('projectAccessTimes') || '{}');
                  const sortedProjects = [...projects].sort((a, b) => {
                    const aId = a._id || a.id;
                    const bId = b._id || b.id;
                    const aAccess = accessData[aId] ? new Date(accessData[aId]).getTime() : 0;
                    const bAccess = accessData[bId] ? new Date(accessData[bId]).getTime() : 0;
                    
                    // If both have access times, sort by most recent
                    if (aAccess && bAccess) {
                      return bAccess - aAccess;
                    }
                    // If only one has access time, prioritize it
                    if (aAccess && !bAccess) return -1;
                    if (!aAccess && bAccess) return 1;
                    
                    // If neither has access time, sort by updated_at or created_at
                    const aDate = new Date(a.updated_at || a.created_at || a.createdAt || 0).getTime();
                    const bDate = new Date(b.updated_at || b.created_at || b.createdAt || 0).getTime();
                    return bDate - aDate;
                  });
                  
                  return sortedProjects.map((project, idx) => (
                  <button 
                    key={project._id || project.id || idx} 
                    onClick={() => selectProject(project)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group text-left ${
                      selectedProject?._id === project._id || selectedProject?.id === project.id 
                        ? 'bg-gradient-to-r from-[#4C3BCF]/20 to-[#6B5CE6]/20 border border-[#4C3BCF]/30 text-white shadow-lg shadow-[#4C3BCF]/10' 
                        : 'hover:bg-[#1a1a1a]/80 border border-transparent hover:border-[#2a2a2a]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${
                        idx % 3 === 0 ? 'bg-green-400 shadow-green-400/50' : 
                        idx % 3 === 1 ? 'bg-yellow-400 shadow-yellow-400/50' : 
                        'bg-[#4C3BCF] shadow-[#4C3BCF]/50'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{project.name}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-gray-500 group-hover:text-gray-300 transition-colors">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  ));
                })()}
                  </div>
            )}
                </div>
            </div>
          </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 border border-[#2a2a2a]">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
              placeholder="Enter project name..."
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#4C3BCF] transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 px-4 py-2.5 bg-[#0a0a0a] hover:bg-[#111111] border border-[#2a2a2a] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create
              </button>
        </div>
      </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`main-scroll flex-1 relative z-10 smooth-scroll ${activePage === 'projects' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {/* Dark Gradient Overlay */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#111111] pointer-events-none" style={{ zIndex: -1 }}></div>
        
        {/* Header */}
        <div 
          className={`bg-[#0a0a0a]/40 backdrop-blur-2xl border-b border-[#1f1f1f]/30 px-8 py-5 flex items-center justify-between z-20 shadow-lg shadow-black/10 transition-all duration-300 ${activePage === 'projects' ? '' : 'sticky top-0'}`}
          style={{ 
            marginLeft: isProjectsPanelOpen 
              ? (sidebarCollapsed ? 'calc(5rem + 14rem)' : 'calc(15rem + 14rem)') 
              : '0'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg shadow-black/5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4C3BCF]/20 to-[#6B5CE6]/20 flex items-center justify-center backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-[#4C3BCF]">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
              <h1 className="text-base font-semibold capitalize bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{activePage}</h1>
            </div>

            {/* Project Info - Only show when on projects page */}
            {activePage === 'projects' && selectedProject && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg shadow-black/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white leading-tight">{selectedProject.name}</span>
                  {selectedProject.repos && selectedProject.repos.length > 0 ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <div className="flex items-center gap-1">
                        <span>{selectedProject.repos.length} repositories</span>
                        <div className="flex gap-1 ml-1">
                          {selectedProject.repos.map((repo, idx) => (
                            <span key={idx} className={`px-1.5 py-0.5 text-xs rounded ${
                              repo.type === 'frontend' ? 'bg-green-500/20 text-green-400' :
                              repo.type === 'backend' ? 'bg-[#4C3BCF]/20 text-[#4C3BCF]' :
                              repo.type === 'fullstack' ? 'bg-[#4C3BCF]/20 text-[#4C3BCF]' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {repo.type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => githubConnected && setShowRepoModal(true)}
                        className="text-[#4C3BCF] hover:text-[#6B5CE6] ml-0.5 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  ) : selectedProject.repo ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>{selectedProject.repo.full_name}</span>
                      <button
                        onClick={() => githubConnected && setShowRepoModal(true)}
                        className="text-[#4C3BCF] hover:text-[#6B5CE6] ml-0.5 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => githubConnected ? setShowRepoModal(true) : alert("Please connect GitHub first")}
                      className="text-xs text-[#4C3BCF] hover:text-[#6B5CE6] transition-colors flex items-center gap-1"
                    >
                      <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Connect Repositories
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 py-2.5">Last update 12min ago</span>
            
            {/* Integration Status Icons */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg shadow-black/5">
              {/* Slack */}
              <div className="relative group">
                <div 
                  onClick={slackConnected ? null : connectSlack}
                  className={`w-8 h-8 ${slackConnected ? 'bg-green-500/20 border-green-500/30 shadow-lg shadow-green-500/10' : 'bg-white/5 border-white/10 hover:bg-green-500/20 hover:border-green-500/30'} border rounded-lg backdrop-blur-sm flex items-center justify-center ${slackConnected ? '' : 'cursor-pointer'} transition-all p-1.5`}
                >
                  <Image 
                    src="/Images/slack.png" 
                    alt="Slack" 
                    width={20} 
                    height={20}
                    className={`w-full h-full object-contain transition-all ${!slackConnected ? 'grayscale group-hover:grayscale-0' : ''}`}
                  />
                  {slackConnected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0a0a]"></span>}
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  {slackConnected ? 'Slack Connected' : 'Click to Connect Slack'}
                </div>
              </div>
              
              {/* GitHub */}
              <div className="relative group">
                <div 
                  onClick={githubConnected ? null : connectGithub}
                  className={`w-8 h-8 ${githubConnected ? 'bg-[#4C3BCF]/20 border-[#4C3BCF]/30 shadow-lg shadow-[#4C3BCF]/10' : 'bg-white/5 border-white/10 hover:bg-[#4C3BCF]/20 hover:border-[#4C3BCF]/30'} border rounded-lg backdrop-blur-sm flex items-center justify-center ${githubConnected ? '' : 'cursor-pointer'} transition-all p-1.5`}
                >
                  <Image 
                    src="/Images/github.png" 
                    alt="GitHub" 
                    width={20} 
                    height={20}
                    className={`w-full h-full object-contain transition-all ${!githubConnected ? 'grayscale group-hover:grayscale-0' : ''}`}
                  />
                  {githubConnected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4C3BCF] rounded-full border-2 border-[#0a0a0a]"></span>}
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  {githubConnected ? 'GitHub Connected' : 'Click to Connect GitHub'}
                </div>
              </div>
              
              {/* Jira */}
              <div className="relative group">
                <div 
                  onClick={jiraConnected ? null : () => setShowJiraModal(true)}
                  className={`w-8 h-8 ${jiraConnected ? 'bg-blue-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30'} border rounded-lg backdrop-blur-sm flex items-center justify-center ${jiraConnected ? '' : 'cursor-pointer'} transition-all p-1.5`}
                >
                  <svg className={`w-full h-full ${!jiraConnected ? 'opacity-50' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001z"/>
                  </svg>
                  {jiraConnected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-[#0a0a0a]"></span>}
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  {jiraConnected ? 'Jira Connected' : 'Click to Connect Jira'}
                </div>
              </div>
              
              {/* Asana */}
              <div className="relative group">
                <div className="w-8 h-8 bg-white/5 border border-white/10 hover:bg-pink-500/20 hover:border-pink-500/30 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all p-1.5">
                  <Image 
                    src="/Images/asana.png" 
                    alt="Asana" 
                    width={20} 
                    height={20}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  Asana - Not Connected
                </div>
              </div>
              
              {/* Notion */}
              <div className="relative group">
                <div className="w-8 h-8 bg-white/5 border border-white/10 hover:bg-black/20 hover:border-black/30 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all p-1.5">
                  <Image 
                    src="/Images/notion.png" 
                    alt="Notion" 
                    width={20} 
                    height={20}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  Notion - Not Connected
                </div>
              </div>
              
              {/* Google Calendar */}
              <div className="relative group">
                <div className="w-8 h-8 bg-white/5 border border-white/10 hover:bg-[#4C3BCF]/20 hover:border-[#4C3BCF]/30 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all p-1.5">
                  <Image 
                    src="/Images/google-calendar.png" 
                    alt="Google Calendar" 
                    width={20} 
                    height={20}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  Google Calendar - Not Connected
                </div>
              </div>
            </div>
            
            <div className="flex -space-x-2 py-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] border-2 border-[#0a0a0a] ring-1 ring-white/10 shadow-lg"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] border-2 border-[#0a0a0a] ring-1 ring-white/10 shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={activePage === 'projects' ? 'h-[calc(100vh-80px)] flex flex-col w-full max-w-[1400px] mx-auto' : 'p-8 pb-16 min-h-full relative'}>
          {activePage === 'dashboard' ? (
            <>
          {/* Greeting */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Good {getGreeting()}, {userName}!</h2>
              <p className="text-gray-400 text-sm">Here is today's overview</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg transition-all font-medium">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Import</span>
              </button>
              <button 
                onClick={() => {
                  if (!isProjectsPanelOpen) {
                    toggleProjectsPanel();
                  }
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white text-black hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            <div className="gpu-accelerate bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-3">Active projects</p>
                  <p className="text-4xl font-bold tracking-tight">{dashboardStats.activeProjects}</p>
                </div>
                <div className="w-14 h-14 bg-[#1a1a1a]/50 group-hover:bg-[#222222]/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-all ml-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 4V20M16 4V20M4 12H20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="gpu-accelerate bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-3">Priority tasks</p>
                  <p className="text-4xl font-bold tracking-tight">{dashboardStats.priorityTasks}</p>
                </div>
                <div className="w-14 h-14 bg-[#1a1a1a]/50 group-hover:bg-[#222222]/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-all ml-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="gpu-accelerate bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-3">Tasks completed</p>
                  <p className="text-4xl font-bold tracking-tight">{dashboardStats.tasksCompleted}</p>
                </div>
                <div className="w-14 h-14 bg-[#1a1a1a]/50 group-hover:bg-[#222222]/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-all ml-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="gpu-accelerate bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-3">Members</p>
                  <p className="text-4xl font-bold tracking-tight">{dashboardStats.members}</p>
                </div>
                <div className="w-14 h-14 bg-[#1a1a1a]/50 group-hover:bg-[#222222]/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-all ml-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 21V19C2 16.5 4.5 14.5 7.5 14.5H10.5C13.5 14.5 16 16.5 16 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 21V19.5C22 17.5 20 16 18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Activity */}
          <div className="grid grid-cols-3 gap-6 mb-8 items-stretch">
            {/* Progress Report - Radial Bar Chart */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-8 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Team Performance</h3>
                  <p className="text-sm text-gray-400 mt-1">Real-time Task Status</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] rounded-lg text-gray-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 1V3M10 1V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span>Live Data</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center pb-0 min-h-[400px]">
                {/* Individual Status Circles */}
                <div className="w-full max-w-[500px] flex flex-col gap-8 items-center justify-center">
                  {/* Completed Circle */}
                  <div className="flex items-center gap-6 w-full group">
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] flex items-center justify-center shadow-lg shadow-[#4C3BCF]/30 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#4C3BCF]/50">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{teamPerformanceData.completedCount || 0}</div>
                          <div className="text-xs text-white/80 mt-1 font-medium">Completed</div>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-[#0f0f0f] animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-300 mb-1">Completed Tasks</div>
                      <div className="text-xs text-gray-400">
                        {teamPerformanceData.totalCount > 0 
                          ? `${Math.round((teamPerformanceData.completedCount / teamPerformanceData.totalCount) * 100)}% of total tasks`
                          : 'No tasks yet'}
                      </div>
                      <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${teamPerformanceData.totalCount > 0 ? (teamPerformanceData.completedCount / teamPerformanceData.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* In Progress Circle */}
                  <div className="flex items-center gap-6 w-full group">
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-lg shadow-[#3B82F6]/30 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#3B82F6]/50">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{teamPerformanceData.inProgressCount || 0}</div>
                          <div className="text-xs text-white/80 mt-1 font-medium">In Progress</div>
                    </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-[#0f0f0f] animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-300 mb-1">In Progress Tasks</div>
                      <div className="text-xs text-gray-400">
                        {teamPerformanceData.totalCount > 0 
                          ? `${Math.round((teamPerformanceData.inProgressCount / teamPerformanceData.totalCount) * 100)}% of total tasks`
                          : 'No tasks yet'}
                      </div>
                      <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${teamPerformanceData.totalCount > 0 ? (teamPerformanceData.inProgressCount / teamPerformanceData.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Circle */}
                  <div className="flex items-center gap-6 w-full group">
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-lg shadow-[#F59E0B]/30 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#F59E0B]/50">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{teamPerformanceData.pendingCount || 0}</div>
                          <div className="text-xs text-white/80 mt-1 font-medium">Pending</div>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 border-4 border-[#0f0f0f] animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-300 mb-1">Pending Tasks</div>
                      <div className="text-xs text-gray-400">
                        {teamPerformanceData.totalCount > 0 
                          ? `${Math.round((teamPerformanceData.pendingCount / teamPerformanceData.totalCount) * 100)}% of total tasks`
                          : 'No tasks yet'}
                      </div>
                      <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${teamPerformanceData.totalCount > 0 ? (teamPerformanceData.pendingCount / teamPerformanceData.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                    
                {/* Footer */}
                <div className="w-full mt-8 flex flex-col gap-2 text-sm px-2">
                  <div className="flex items-center gap-2 leading-none font-medium text-gray-300">
                    {teamPerformanceData.pendingCount > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-yellow-400" />
                        {teamPerformanceData.pendingCount} task{teamPerformanceData.pendingCount !== 1 ? 's' : ''} pending completion
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        All tasks completed
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 leading-none">
                    {teamPerformanceData.totalCount > 0 ? (
                      `Total: ${teamPerformanceData.totalCount} tasks • ${teamPerformanceData.completedCount} completed • ${teamPerformanceData.inProgressCount} in progress`
                    ) : (
                      'No tasks assigned yet'
                    )}
                </div>
                    </div>
                    </div>
                  </div>
                  
            {/* Pending Tasks */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h3 className="text-lg font-semibold">Pending Tasks</h3>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">View All</button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: '600px', minHeight: '500px' }}>
                {pendingTasksForDisplay.length > 0 ? pendingTasksForDisplay.map((task, i) => (
                  <div key={task.id || i} className="flex items-start gap-3 group pb-3 border-b border-[#1f1f1f]/30 last:border-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] flex items-center justify-center text-white text-xs font-semibold">
                        {task.user?.charAt(0) || 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 border-2 border-[#0f0f0f]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{task.user || 'Unassigned'}</span>
                        <span className="text-xs text-gray-500">{task.time || 'Recently'}</span>
                      </div>
                      <p className="text-sm text-white leading-relaxed font-medium mb-1">{task.action || 'Untitled task'}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs rounded-lg border ${
                          task.status === 'pending_approval' 
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                            : 'bg-[#4C3BCF]/20 text-[#4C3BCF] border-[#4C3BCF]/30'
                        }`}>
                          {task.status === 'pending_approval' ? 'Pending Approval' : 'Pending'}
                        </span>
                        {task.priority && task.priority !== 'medium' && (
                          <span className={`px-2 py-0.5 text-xs rounded-lg border ${
                            task.priority === 'high' || task.priority === 'urgent'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 text-sm">No pending tasks</div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h3 className="text-lg font-semibold">Recent activity</h3>
                <button className="text-xs text-gray-400 hover:text-white transition-colors duration-200">View All</button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: '500px' }}>
                {dashboardActivities.length > 0 ? dashboardActivities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 group p-3 rounded-lg hover:bg-[#1a1a1a]/50 transition-all duration-200 cursor-pointer">
                    <div className="relative flex-shrink-0 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] group-hover:scale-125 transition-transform duration-200"></div>
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#4C3BCF] opacity-50 group-hover:opacity-75 animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all duration-200 p-1 rounded hover:bg-[#2a2a2a]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10 4L4 10M4 4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-white group-hover:text-[#6B5CE6] transition-colors duration-200">{activity.user}</span>
                        <span className="text-gray-400">, {activity.action}</span>
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 text-sm">No recent activity</div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl overflow-hidden mb-8 hover:border-[#2a2a2a] transition-all duration-300">
            <div className="p-6 border-b border-[#1f1f1f]/50 flex items-center gap-4 bg-[#0a0a0a]/40">
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="search projects..."
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#2a2a2a] transition-colors text-white placeholder-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg transition-all">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4L7 9L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>All status</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg transition-all">
                <span>More</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 6L7 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="flex-1"></div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg transition-all">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M7 2V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Export</span>
              </button>
              <button 
                onClick={() => {
                  if (!isProjectsPanelOpen) {
                    toggleProjectsPanel();
                  }
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white text-black hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M7 2V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Add Project</span>
              </button>
            </div>

            <table className="w-full bg-transparent">
              <thead className="bg-transparent">
                <tr className="border-b border-[#1f1f1f]/50 bg-transparent">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent"></th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Project name</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Assigned to</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Status</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Tasks</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Task title</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Intensity</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Date added</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Recent updates</th>
                   <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Manage</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {dashboardProjects.length > 0 ? dashboardProjects.map((project, i) => {
                  const projectId = project._id || project.id;
                  const tasks = projectTasks[projectId] || [];
                  const firstTask = tasks.length > 0 ? tasks[0] : null;
                  const taskTitle = firstTask?.title ? (firstTask.title.length > 30 ? firstTask.title.substring(0, 30) + '...' : firstTask.title) : '-';
                  
                  // Get assigned person from tasks
                  const getAssignedPerson = (tasks) => {
                    if (!tasks || tasks.length === 0) return null;
                    
                    // Get unique assigned persons
                    const assignedPersons = tasks
                      .map(task => task.assigned_to)
                      .filter(assigned => assigned && assigned !== 'Unassigned')
                      .filter((value, index, self) => self.indexOf(value) === index); // Get unique values
                    
                    if (assignedPersons.length === 0) return null;
                    if (assignedPersons.length === 1) return assignedPersons[0];
                    // If multiple different assignees, show first one with count
                    return `${assignedPersons[0]} (+${assignedPersons.length - 1})`;
                  };
                  
                  const assignedPerson = getAssignedPerson(tasks);
                  
                  // Calculate intensity based on tasks
                  const calculateIntensity = (tasks) => {
                    if (!tasks || tasks.length === 0) return { level: '-', color: 'gray' };
                    
                    let totalHours = 0;
                    let hasUrgent = false;
                    let highPriorityCount = 0;
                    let totalEstimated = 0;
                    
                    tasks.forEach(task => {
                      const hours = parseFloat(task.estimated_hours) || 0;
                      totalHours += hours;
                      totalEstimated++;
                      
                      const priority = (task.priority || '').toLowerCase();
                      if (priority === 'urgent') hasUrgent = true;
                      if (priority === 'high' || priority === 'urgent') highPriorityCount++;
                    });
                    
                    const avgHours = totalEstimated > 0 ? totalHours / totalEstimated : 0;
                    const highPriorityRatio = tasks.length > 0 ? highPriorityCount / tasks.length : 0;
                    
                    // Determine intensity
                    if (hasUrgent || avgHours > 16 || (avgHours > 12 && highPriorityRatio > 0.5)) {
                      return { level: 'Complex', color: 'red' };
                    } else if (avgHours > 8 || (avgHours > 6 && highPriorityRatio > 0.3)) {
                      return { level: 'Hard', color: 'orange' };
                    } else if (avgHours > 4 || highPriorityRatio > 0.2) {
                      return { level: 'Medium', color: 'yellow' };
                    } else if (avgHours > 0 || tasks.length > 0) {
                      return { level: 'Easy', color: 'green' };
                    } else {
                      return { level: '-', color: 'gray' };
                    }
                  };
                  
                  const intensity = calculateIntensity(tasks);
                  const intensityColors = {
                    green: 'bg-green-500/10 text-green-400 border-green-500/30',
                    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                    red: 'bg-red-500/10 text-red-400 border-red-500/30',
                    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                  };
                  
                  return (
                  <tr key={i} className="border-b border-[#1f1f1f]/50 bg-transparent hover:bg-[#0f0f0f]/50 transition-colors">
                    <td className="px-6 py-4 bg-transparent">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-500 bg-gray-700 cursor-not-allowed opacity-50" disabled />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium bg-transparent">{project.name}</td>
                    <td className="px-6 py-4 bg-transparent">
                        {assignedPerson ? (
                      <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6]"></div>
                            <span className="text-sm">{assignedPerson}</span>
                      </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                    </td>
                    <td className="px-6 py-4 bg-transparent">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#4C3BCF]/10 text-[#4C3BCF]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4C3BCF]"></span>
                        Active
                      </span>
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">{tasks.length > 0 ? tasks.length : '0'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 bg-transparent" title={firstTask?.title || ''}>{taskTitle}</td>
                      <td className="px-6 py-4 bg-transparent">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${intensityColors[intensity.color]}`}>
                          {intensity.level}
                        </span>
                      </td>
                    <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">
                      {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 bg-transparent">
                      <button className="text-sm text-gray-400 hover:text-white transition-colors">Manage</button>
                    </td>
                  </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500 bg-transparent">
                      No projects yet. Create your first project to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </>
          ) : activePage === 'projects' ? (
            /* Projects View - Chat Interface */
            <>
              {!selectedProject ? (
                /* Initial Screen - No Project Selected */
                <div className="flex flex-col items-center justify-center flex-1 px-4">
                  <div className="w-full max-w-2xl -mt-20">
                    <h1 className="text-3xl md:text-4xl font-semibold text-center mb-8 text-white">
                      What can I help with?
                    </h1>
                    
                    <div className="relative">
                      <div className="bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-[#3f3f3f] rounded-3xl shadow-lg transition-all duration-200">
                        <div className="flex items-center px-4 py-2.5">
                          <button className="p-2 hover:bg-[#404040] rounded-xl transition-colors mr-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !selectedProject && alert("Please select or create a project first")}
                            placeholder="Select a project to start..."
                            disabled={!selectedProject}
                            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base px-2"
                          />
        </div>
      </div>
      </div>
                    
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Select a project from the sidebar or create a new one to get started
                    </p>
                  </div>
                </div>
              ) : (
                /* Chat Interface - Project Selected */
                <>
                  {messages.length === 0 && !isLoading ? (
                    /* Empty State - Show heading and input when no messages */
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                      <div className="w-full max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-semibold text-center text-white mb-8">
                          Write the task and assign
                        </h1>
                        
                        {/* Centered Input Box */}
                        <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-3xl">
                          <div className="flex items-center px-4 py-2.5">
                            {/* Attachment Icon */}
                            <button
                              type="button"
                              className="p-2 hover:bg-[#404040] rounded-xl transition-colors text-gray-400 hover:text-white"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                              </svg>
                            </button>
                            
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                              placeholder="Describe your task..."
                              disabled={isLoading}
                              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base px-2"
                            />
                            
                            <button
                              onClick={sendMessage}
                              disabled={!input.trim() || isLoading}
                              className="p-2 hover:bg-[#404040] rounded-xl transition-colors disabled:opacity-50"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Messages Area */
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                      <div className="max-w-3xl mx-auto space-y-6 pl-12">
                        {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          {msg.role === 'user' ? (
                            /* User Avatar */
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          ) : (
                            /* Feeta Logo */
                            <div className="w-8 h-8 rounded-md flex-shrink-0 overflow-hidden bg-white">
                              <Image 
                                src="/Images/F2.png" 
                                alt="Feeta AI" 
                                width={32} 
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-[#2f2f2f]' : 'bg-[#1a1a1a]'} rounded-2xl p-4`}>
                            <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                            
                            {/* Show Questions if ambiguous */}
                            {msg.questions && !msg.answered && (
                              <QuestionForm 
                                questions={msg.questions} 
                                onSubmit={(answers) => submitAnswers(idx, answers)}
                                messageIndex={idx}
                              />
                            )}
                            
                            {/* Show Plan if available */}
                           {msg.plan && (
  <div className="mt-4 space-y-2">
    <div className="flex items-center justify-between mb-2">
      <div>
    <p className="font-semibold text-sm text-green-400">✓ Plan Created</p>
        {msg.plan.main_task && (
          <p className="text-xs text-gray-400 mt-1">{msg.plan.main_task}</p>
        )}
      </div>
      {selectedProject && (
        <button
          onClick={() => {
            const projectId = selectedProject._id || selectedProject.id;
            console.log('🔍 Selected project:', selectedProject);
            console.log('🔍 Project ID to use:', projectId);
            if (projectId) {
              showPendingTasksApproval(projectId);
            } else {
              alert('Project ID is missing. Please select a project first.');
            }
          }}
          className="px-3 py-1.5 text-xs bg-[#4C3BCF]/20 text-[#4C3BCF] border border-[#4C3BCF]/30 rounded-lg hover:bg-[#4C3BCF]/30 transition-all"
        >
          Review & Approve Tasks
        </button>
      )}
      {msg.plan.subtasks && msg.plan.subtasks.length > 0 && (
        <div className="text-xs text-gray-400 space-y-1">
          {(() => {
            const totalHours = msg.plan.subtasks.reduce((sum, t) => {
              const hours = parseFloat(t.estimated_hours) || 0;
              return sum + hours;
            }, 0);
            const totalTimeline = totalHours < 8 ? `${Math.round(totalHours)}h` : 
                                 totalHours < 40 ? `${Math.round(totalHours/8)}d` : 
                                 `${Math.round(totalHours/40)}w`;
            
            // Find earliest and latest deadlines
            const deadlines = msg.plan.subtasks
              .map(t => t.deadline)
              .filter(d => d)
              .map(d => new Date(d))
              .filter(d => !isNaN(d.getTime()));
            
            const earliestDeadline = deadlines.length > 0 ? 
              new Date(Math.min(...deadlines.map(d => d.getTime()))) : null;
            const latestDeadline = deadlines.length > 0 ? 
              new Date(Math.max(...deadlines.map(d => d.getTime()))) : null;
            
            return (
              <div className="text-right">
                <div className="text-[#4C3BCF]">⏱️ Total Time: {totalTimeline}</div>
                {totalHours > 0 && <div className="text-yellow-400">⏰ {Math.round(totalHours)} hours</div>}
                {earliestDeadline && (
                  <div className="text-green-400">📅 Start: {earliestDeadline.toLocaleDateString()}</div>
                )}
                {latestDeadline && (
                  <div className="text-orange-400">📅 End: {latestDeadline.toLocaleDateString()}</div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
    <div className="space-y-1">
      {msg.plan.subtasks?.map((task, i) => (
        <div
          key={i}
          className="text-sm text-gray-400 pl-4 border-l-2 border-gray-700 bg-[#1a1a1a] p-3 rounded-lg"
        >
          <div className="font-medium text-gray-300 flex items-center justify-between">
            <span>{i + 1}. {task.title || task.task}</span>
            <div className="flex items-center gap-2 text-xs">
              {task.timeline && (
                <span className="text-[#4C3BCF]">⏱️ {task.timeline}</span>
              )}
              {task.deadline && (
                <span className="text-orange-400">📅 {new Date(task.deadline).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {task.role && (
            <div className="text-xs text-[#4C3BCF] mt-1">👤 {task.role}</div>
          )}
          {task.assigned_to && task.assigned_to !== 'Unassigned' && (
            <div className="text-xs text-[#4C3BCF] mt-1">👥 Assigned to: {task.assigned_to}</div>
          )}
          {task.estimated_hours && (
            <div className="text-xs text-yellow-400 mt-1">⏰ Estimated: {task.estimated_hours} hours</div>
          )}
          <div className="text-xs mt-1">{task.description}</div>
        </div>
      ))} {/* ✅ properly closed .map() here */}
    </div>
  </div>
)}

                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-3">
                          {/* Feeta Logo for Loading */}
                          <div className="w-8 h-8 rounded-md flex-shrink-0 overflow-hidden bg-white">
                            <Image 
                              src="/Images/F2.png" 
                              alt="Feeta AI" 
                              width={32} 
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="bg-[#1a1a1a] rounded-2xl p-4">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                      </div>
                    </div>
                  )}
                  
                  {/* Input Area - Fixed at Bottom - Only show when there are messages */}
                  {(messages.length > 0 || isLoading) && (
                  <div className="flex-shrink-0 border-t border-[#1f1f1f]/20 px-4 py-4 bg-transparent">
                    <div className="max-w-3xl mx-auto pl-12">
                      <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-3xl">
                        <div className="flex items-center px-4 py-2.5">
                          {/* Attachment Icon */}
                          <button
                            type="button"
                            className="p-2 hover:bg-[#404040] rounded-xl transition-colors text-gray-400 hover:text-white"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                          </button>
                          
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                            placeholder="Describe your task..."
                            disabled={isLoading}
                            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base px-2"
                          />
                          
                          <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-2 hover:bg-[#404040] rounded-xl transition-colors disabled:opacity-50"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </>
              )}
            </>
          ) : activePage === 'tasks' ? (
            /* Tasks Page */
            (() => {
              console.log('🎬 Rendering TasksPage component - activePage is "tasks"');
              console.log('👤 User object:', user ? { email: user.email, id: user.id } : 'No user');
              console.log('📋 This component will load ALL tasks from ALL projects');
              return <TasksPage key="tasks-page" user={user} />;
            })()
          ) : activePage === 'teams' ? (
            /* Teams Page */
            <TeamsPage user={user} />
          ) : activePage === 'recent-projects' ? (
            /* Recent Projects Page */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Recent Projects</h2>
                  <p className="text-gray-400 text-sm">Latest two projects with details</p>
                </div>
              </div>

              {(() => {
                // Get latest 2 projects sorted by most recently accessed
                const accessData = JSON.parse(localStorage.getItem('projectAccessTimes') || '{}');
                const sortedProjects = [...projects].sort((a, b) => {
                  const aId = a._id || a.id;
                  const bId = b._id || b.id;
                  const aAccess = accessData[aId] ? new Date(accessData[aId]).getTime() : 0;
                  const bAccess = accessData[bId] ? new Date(accessData[bId]).getTime() : 0;
                  
                  // If both have access times, sort by most recent
                  if (aAccess && bAccess) {
                    return bAccess - aAccess;
                  }
                  // If only one has access time, prioritize it
                  if (aAccess && !bAccess) return -1;
                  if (!aAccess && bAccess) return 1;
                  
                  // If neither has access time, sort by updated_at or created_at
                  const aDate = new Date(a.updated_at || a.created_at || a.createdAt || 0).getTime();
                  const bDate = new Date(b.updated_at || b.created_at || b.createdAt || 0).getTime();
                  return bDate - aDate;
                });
                const recentProjects = sortedProjects.slice(0, 2);

                if (recentProjects.length === 0) {
                  return (
                    <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-12 text-center">
                      <p className="text-gray-400 mb-4">No projects found</p>
                      <p className="text-gray-500 text-sm">Create a project to see it here</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentProjects.map((project, index) => {
                      const createdDate = project.created_at || project.createdAt;
                      const formattedDate = createdDate 
                        ? new Date(createdDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Date not available';

                      return (
                        <div
                          key={project._id || project.id || index}
                          className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all cursor-pointer"
                          onClick={() => {
                            selectProject(project);
                            setActivePage('projects');
                            toggleProjectsPanel();
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                              <h3 className="text-xl font-bold text-white">{project.name}</h3>
                            </div>
                            <span className="text-xs text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Project ID</p>
                              <p className="text-sm text-gray-300 font-mono">{project._id || project.id || 'N/A'}</p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Created At</p>
                              <p className="text-sm text-gray-300">{formattedDate}</p>
                            </div>

                            {project.description && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Description</p>
                                <p className="text-sm text-gray-300 line-clamp-2">{project.description}</p>
                              </div>
                            )}

                            {project.status && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs ${
                                  project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                  project.status === 'on-hold' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {project.status}
                                </span>
                              </div>
                            )}

                            {project.team_members && project.team_members.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Team Members</p>
                                <p className="text-sm text-gray-300">{project.team_members.length} member(s)</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Open Project
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : activePage === 'issue-resolution' ? (
            /* Issue Resolution Page */
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Issue Resolution</h1>
                    <p className="text-gray-400">Tag Feeta in Slack and get AI-powered solutions based on your project context</p>
                  </div>
                  {/* Auto-Fetch Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-300">Auto-Fetch</p>
                      <p className="text-xs text-gray-500">
                        {autoFetchEnabled ? (
                          <span className="text-green-400">Active • Scans all channels every minute</span>
                        ) : (
                          <span>Inactive</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoFetchEnabled(!autoFetchEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoFetchEnabled ? 'bg-[#4C3BCF]' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoFetchEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {/* Auto-Fetch Status */}
                {autoFetchEnabled && (
                  <div className="bg-[#4C3BCF]/10 border border-[#4C3BCF]/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          autoFetchStatus === 'scanning' ? 'bg-yellow-400 animate-pulse' :
                          autoFetchStatus === 'processing' ? 'bg-green-400 animate-pulse' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-300">
                            {autoFetchStatus === 'scanning' ? 'Scanning all channels...' :
                             autoFetchStatus === 'processing' ? 'Processing mentions...' :
                             'Monitoring channels'}
                          </p>
                          {lastScanTime && (
                            <p className="text-xs text-gray-500">Last scan: {lastScanTime}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total Mentions Found</p>
                        <p className="text-lg font-bold text-[#4C3BCF]">{totalMentionsFound}</p>
                        <p className="text-xs text-gray-400 mt-1">Total Processed</p>
                        <p className="text-sm font-semibold text-green-400">{totalProcessed}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!slackConnected ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
                  <p className="text-yellow-400 mb-4">⚠️ Slack is not connected. Please connect Slack to use Issue Resolution.</p>
                  <button
                    onClick={connectSlack}
                    className="px-4 py-2 bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 text-white rounded-lg transition-colors"
                  >
                    Connect Slack
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Activity Logs Section - Always visible when Slack is connected */}
                  <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Activity Logs & Debug</h3>
                          {autoFetchEnabled && (
                            <p className="text-xs text-gray-400 mt-1">Auto-fetch is active - scans once immediately, then every minute. Each mention processed only once.</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setRefreshLogs([]);
                            setChannelMessages([]);
                            setTotalMentionsFound(0);
                            setTotalProcessed(0);
                          }}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Logs Display */}
                      {(refreshLogs.length > 0 || autoFetchEnabled) && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium mb-3 text-gray-300">
                            Processing Logs {autoFetchEnabled && <span className="text-[#4C3BCF]">(Live)</span>}
                          </h4>
                          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                            {refreshLogs.length > 0 ? (
                              refreshLogs.map((log, idx) => (
                                <div key={idx} className={`flex items-start gap-2 text-xs ${
                                  log.type === 'success' ? 'text-green-400' :
                                  log.type === 'error' ? 'text-red-400' :
                                  'text-gray-400'
                                }`}>
                                  <span className="text-gray-600 font-mono text-[10px] mt-0.5 min-w-[60px]">
                                    {log.timestamp}
                                  </span>
                                  <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                                </div>
                              ))
                            ) : autoFetchEnabled ? (
                              <div className="text-xs text-gray-500 text-center py-4">
                                Waiting for new @Feeta mentions... Scans all channels every minute. Each mention is processed only once.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Channel Messages Display */}
                      {channelMessages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3 text-gray-300">
                            Channel Messages ({channelMessages.length} found)
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">
                            Showing messages from users only (Feeta's own messages are excluded)
                          </p>
                          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                            {channelMessages.map((msg, idx) => (
                              <div key={idx} className={`p-3 rounded-lg border ${
                                msg.is_mention 
                                  ? 'bg-[#4C3BCF]/10 border-[#4C3BCF]/30' 
                                  : 'bg-[#1a1a1a] border-[#2a2a2a]'
                              }`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4C3BCF] to-[#6B5CE6] flex items-center justify-center text-white text-[10px] font-bold">
                                      {msg.user_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">
                                      {msg.user_name || 'Unknown User'}
                                    </span>
                                    {msg.is_mention && (
                                      <span className="px-2 py-0.5 bg-[#4C3BCF]/20 text-[#4C3BCF] text-[10px] rounded-full border border-[#4C3BCF]/30">
                                        @Feeta Mention
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleString() : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 whitespace-pre-wrap">{msg.text}</p>
                                {msg.question && (
                                  <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                                    <p className="text-xs text-gray-500 mb-1">Extracted Question:</p>
                                    <p className="text-sm text-[#4C3BCF]">{msg.question}</p>
                                  </div>
                                )}
                                {msg.status && (
                                  <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      msg.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                                      msg.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {msg.status === 'processed' ? '✅ Processed' :
                                       msg.status === 'error' ? '❌ Error' :
                                       '⏳ Processing...'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </div>
          ) : (
            /* Other Pages */
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-3 capitalize">{activePage}</h2>
                <p className="text-gray-400">This page is under construction</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Task Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Review & Approve Tasks</h3>
                <p className="text-sm text-gray-400 mt-1">{pendingTasks.length} tasks pending approval</p>
              </div>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setPendingTasks([]);
                  setTaskAssignments({});
                }}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Slack Channel Selection - Required */}
            {slackConnected ? (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Slack Channel *</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  required
                >
                  <option value="">Select a channel...</option>
                  {slackChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                {slackChannels.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">Loading channels...</p>
                )}
              </div>
            ) : (
              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">⚠️ Slack not connected. Tasks will be approved but not sent to Slack.</p>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4 mb-6">
              {pendingTasks.map((task) => {
                // Get assigned member (auto-selected best match)
                const assignment = taskAssignments[task.id];
                const assignedMember = assignment 
                  ? task.suggested_members?.find(m => m.name === assignment.assigned_member_name)
                  : (task.suggested_members && task.suggested_members.length > 0 ? task.suggested_members[0] : null);
                
                return (
                  <div key={task.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-400 mb-2">{task.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {task.deadline && (
                            <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                          )}
                          {task.timeline && <span>⏱️ {task.timeline}</span>}
                          {task.estimated_hours && <span>⏰ {task.estimated_hours}h</span>}
                        </div>
                      </div>
                    </div>

                    {/* Show assigned member */}
                    {assignedMember && (
                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                        <p className="text-xs text-gray-500 mb-2">👤 Assigned to:</p>
                        <div className="flex items-center gap-2 p-2 bg-[#4C3BCF]/10 border border-[#4C3BCF]/20 rounded-lg">
                          <span className="text-sm font-medium text-gray-300">{assignedMember.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            assignedMember.status === 'idle' ? 'bg-green-500/20 text-green-400' :
                            assignedMember.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {assignedMember.status}
                          </span>
                          {assignedMember.idle_percentage !== undefined && (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              assignedMember.idle_percentage >= 50 ? 'bg-green-500/20 text-green-400' :
                              assignedMember.idle_percentage >= 25 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {assignedMember.idle_percentage.toFixed(1)}% idle
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">{assignedMember.role}</span>
                        </div>
                        {jiraConnected && (
                          <button
                            onClick={() => {
                              setSelectedTaskForJira(task);
                              setShowJiraTaskModal(true);
                            }}
                            className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
                          >
                            Create Jira Issue
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Approve Button */}
            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
              <button
                onClick={handleApproveTasks}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-medium"
              >
                Approve & Send to Slack
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setPendingTasks([]);
                  setTaskAssignments({});
                }}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repository Selection Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Select Repositories
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Choose multiple repositories for full-stack analysis
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  setSelectedRepos([]);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all backdrop-blur-sm border border-white/5 hover:border-white/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Selection Summary */}
            {selectedRepos.length > 0 && (
              <div className="mb-4 p-3 bg-[#4C3BCF]/10 border border-[#4C3BCF]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4C3BCF]">
                    {selectedRepos.length} repositories selected
                  </span>
                  <button
                    onClick={connectReposToProject}
                    className="px-4 py-2 bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 text-white text-sm rounded-lg transition-colors"
                  >
                    Connect Selected
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRepos.map((repo, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[#4C3BCF]/20 text-[#4C3BCF] text-xs rounded">
                      {repo.name}
                      <span className="text-[#4C3BCF]">({repo.type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {repos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-700/20 to-gray-800/20 flex items-center justify-center backdrop-blur-sm border border-gray-700/30">
                  <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" className="text-gray-500">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <p className="text-gray-400 mb-6 text-sm">No repositories found.</p>
                {!githubConnected && (
                  <button
                    onClick={connectGithub}
                    className="px-6 py-3 bg-gradient-to-br from-white to-gray-200 text-black hover:from-gray-100 hover:to-gray-300 rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Connect GitHub
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {repos.map((repo, idx) => {
                    const isSelected = selectedRepos.some(r => r.id === repo.id);
                    const repoType = detectRepoType(repo);
                    
                    return (
                    <button
                      key={idx}
                      onClick={() => toggleRepoSelection(repo)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#4C3BCF]/10 backdrop-blur-sm border-[#4C3BCF]/30 shadow-lg shadow-[#4C3BCF]/10'
                          : 'bg-[#111111]/40 backdrop-blur-sm border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/60 hover:border-[#3a3a3a]/60 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 mt-1">
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-[#4C3BCF] border-[#4C3BCF]' 
                              : 'border-gray-600 hover:border-gray-500'
                          }`}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20,6 9,17 4,12"></polyline>
                              </svg>
                            )}
                          </div>
                          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400 flex-shrink-0">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-base font-semibold text-white">{repo.name}</div>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              repoType === 'frontend' ? 'bg-green-500/20 text-green-400' :
                              repoType === 'backend' ? 'bg-[#4C3BCF]/20 text-[#4C3BCF]' :
                              repoType === 'fullstack' ? 'bg-[#4C3BCF]/20 text-[#4C3BCF]' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {repoType}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">{repo.full_name}</div>
                          {repo.description && (
                            <div className="text-sm text-gray-500 mb-2">{repo.description}</div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#4C3BCF]"></span>
                                <span>{repo.language}</span>
                              </div>
                            )}
                            {repo.stargazers_count > 0 && (
                              <div className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span>{repo.stargazers_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jira Connection Modal */}
      {showJiraModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Connect Jira</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const token = localStorage.getItem('token');
              try {
                const response = await fetch(`${API_BASE_URL}/api/jira/connect`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    jira_url: formData.get('jira_url'),
                    email: formData.get('email'),
                    api_token: formData.get('api_token')
                  })
                });
                const data = await response.json();
                if (response.ok) {
                  alert('✅ Jira connected successfully!');
                  setShowJiraModal(false);
                  checkJiraConnection();
                } else {
                  alert(`❌ ${data.error || 'Failed to connect'}`);
                }
              } catch (error) {
                alert('❌ Connection error');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jira URL</label>
                  <input
                    type="url"
                    name="jira_url"
                    placeholder="https://your-domain.atlassian.net"
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your-email@example.com"
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">API Token</label>
                  <input
                    type="password"
                    name="api_token"
                    placeholder="Your Jira API token"
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Get your API token from: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" className="text-blue-400 hover:underline">Atlassian Account</a>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowJiraModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-all"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jira Task Creation Modal */}
      {showJiraTaskModal && selectedTaskForJira && (() => {
        const loadJiraProjects = async () => {
          const token = localStorage.getItem('token');
          try {
            const response = await fetch(`${API_BASE_URL}/api/jira/projects`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
              setJiraProjects(data.projects || []);
            }
          } catch (error) {
            console.error('Error loading Jira projects:', error);
          }
        };
        if (jiraProjects.length === 0) loadJiraProjects();
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create Jira Issue</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const token = localStorage.getItem('token');
              try {
                const response = await fetch(`${API_BASE_URL}/api/jira/create-issue`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    project_key: formData.get('project_key'),
                    summary: selectedTaskForJira.title,
                    description: selectedTaskForJira.description,
                    issue_type: formData.get('issue_type')
                  })
                });
                const data = await response.json();
                if (response.ok) {
                  alert(`✅ Jira issue created: ${data.issue_key}`);
                  setShowJiraTaskModal(false);
                  setSelectedTaskForJira(null);
                } else {
                  alert(`❌ ${data.error || 'Failed to create issue'}`);
                }
              } catch (error) {
                alert('❌ Error creating issue');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Task</label>
                  <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-sm font-medium">{selectedTaskForJira.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedTaskForJira.description}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jira Project *</label>
                  <select
                    name="project_key"
                    required
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  >
                    <option value="">Select project...</option>
                    {jiraProjects.map((project) => (
                      <option key={project.key} value={project.key}>
                        {project.name} ({project.key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Issue Type</label>
                  <select
                    name="issue_type"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  >
                    <option value="Task">Task</option>
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowJiraTaskModal(false);
                    setSelectedTaskForJira(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-all"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </>
  );
}
