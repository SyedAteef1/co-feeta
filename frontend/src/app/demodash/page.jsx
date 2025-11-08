'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Tasks Page Component
function TasksPage({ user }) {
  console.log('🎯 TasksPage component rendered!', { user: user?.email || 'No user' });
  
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const response = await fetch('https://localhost:5000/api/projects', {
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
      console.log('📡 Fetching tasks from API: https://localhost:5000/api/tasks');
      
      const response = await fetch('https://localhost:5000/api/tasks', {
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
      const response = await fetch('https://localhost:5000/api/teams/members', {
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

      const response = await fetch('https://localhost:5000/api/teams/analyze_resume', {
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

      const response = await fetch('https://localhost:5000/api/teams/members', {
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
      const response = await fetch(`https://localhost:5000/api/teams/members/${memberId}`, {
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
  const [activePage, setActivePage] = useState('dashboard'); // dashboard, projects, tasks, analytics, team
  
  // Project management
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [user, setUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState([]);
  
  // Task approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [slackChannels, setSlackChannels] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({}); // {taskId: {assigned_member_name, assigned_member_email}}
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const router = useRouter();

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
      loadProjects();
      checkGithubConnection();
      checkSlackConnection();
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

  const connectGithub = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first");
      return;
    }
    window.location.href = `https://localhost:5000/github/install?token=${token}`;
  };

  const checkSlackConnection = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://localhost:5000/slack/api/status', {
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
    window.location.href = `https://localhost:5000/slack/install?token=${token}`;
  };

  const connectReposToProject = async () => {
    if (!selectedProject || selectedRepos.length === 0) return;
    
    const token = localStorage.getItem('token');
    try {
      console.log('🔄 Connecting repositories:', selectedRepos);
      const response = await fetch(`https://localhost:5000/api/projects/${selectedProject._id}`, {
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

  const showPendingTasksApproval = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch pending tasks with suggestions
      const tasksRes = await fetch(`https://localhost:5000/api/projects/${projectId}/tasks/pending-approval`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setPendingTasks(tasksData.tasks || []);
        
        // Fetch Slack channels
        const channelsRes = await fetch('https://localhost:5000/api/slack/channels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          setSlackChannels(channelsData.channels || []);
        }
        
        setShowApprovalModal(true);
      } else {
        alert('Failed to load pending tasks');
      }
    } catch (error) {
      console.error('Error loading pending tasks:', error);
      alert('Error loading pending tasks');
    }
  };

  const handleApproveTasks = async () => {
    if (!selectedProject) return;
    
    const taskIds = pendingTasks.map(t => t.id).filter(id => id);
    if (taskIds.length === 0) {
      alert('No tasks to approve');
      return;
    }

    if (!selectedChannel && slackConnected) {
      alert('Please select a Slack channel');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://localhost:5000/api/projects/${selectedProject._id || selectedProject.id}/tasks/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_ids: taskIds,
          channel_id: selectedChannel,
          task_assignments: taskAssignments
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.approved_count} tasks approved and sent to Slack!`);
        setShowApprovalModal(false);
        setPendingTasks([]);
        setTaskAssignments({});
        setSelectedChannel('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to approve tasks'}`);
      }
    } catch (error) {
      console.error('Error approving tasks:', error);
      alert('Failed to approve tasks');
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
      const response = await fetch('https://localhost:5000/api/projects', {
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
        setNewProjectName('');
        setShowCreateModal(false);
        await loadProjects();
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
    // Load project messages if any
    loadProjectMessages(project);
  };

  const loadProjectMessages = async (project) => {
    const token = localStorage.getItem('token');
    if (!token || !project) return;
    
    try {
      const projectId = project._id || project.id;
      const response = await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
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
        await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
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
      
      const res = await fetch("https://localhost:5000/api/analyze", {
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
        const planRes = await fetch("https://localhost:5000/api/generate_plan", {
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
              await fetch(`https://localhost:5000/api/projects/${projectId}/tasks`, {
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
      const planRes = await fetch("https://localhost:5000/api/generate_plan", {
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
            await fetch(`https://localhost:5000/api/projects/${projectId}/messages`, {
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
              await fetch(`https://localhost:5000/api/projects/${projectId}/tasks`, {
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
          className="w-full px-4 py-2 bg-gradient-to-r from-[#4C3BCF] to-purple-600 hover:from-[#4C3BCF]/90 hover:to-purple-600/90 rounded-lg transition-all font-medium text-sm"
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
  `;

  const stats = [
    { 
      label: 'Active projects', 
      value: '4', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 4V20M16 4V20M4 12H20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      label: 'Priority tasks', 
      value: '6', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      label: 'Challenges', 
      value: '2', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      label: 'Members online', 
      value: '5', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 21V19C2 16.5 4.5 14.5 7.5 14.5H10.5C13.5 14.5 16 16.5 16 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 21V19.5C22 17.5 20 16 18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  const activities = [
    { time: 'Now', user: 'Sarah', action: 'Completed Homepage Wireframe' },
    { time: '2h ago', user: 'James', action: 'Updated The User Profile Design' },
    { time: '3:45', user: 'Laura', action: 'Finalized Color Palette' },
    { time: '14:40', user: 'David', action: 'Shared The Mobile App Prototype' },
    { time: '11:30', user: 'Chris', action: 'Conducted A Design Critique Session' }
  ];

  const dashboardProjects = [
    { name: 'Project Hero', creator: 'James', status: 'Active', category: 'Projects', date: '22 Aug 2025', update: 'Phase two work started.' },
    { name: 'Website revamp', creator: 'Sarah', status: 'Editing', category: 'Websites', date: '15 Aug 2025', update: 'Homepage layout under review.' },
    { name: 'Project Hero', creator: 'Chris', status: 'Active', category: 'Projects', date: '12 Aug 2025', update: 'Requirements list submitted.' }
  ];

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
              
              <button className="w-full flex items-center justify-center p-2 text-blue-400 hover:text-blue-300 hover:bg-[#1a1a1a] rounded-lg transition-colors">
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
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Search</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>AI Agent</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Templates</span>
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

          {!sidebarCollapsed && (
          <div className="pt-3 bg-[#111111]">
            <p className="text-xs text-gray-500 px-3 pb-2">Recents</p>
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
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  A
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Aditya</p>
                  <p className="text-xs text-gray-500">Pro</p>
                </div>
                <button className="text-gray-500 hover:text-gray-300 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="4" r="1" fill="currentColor"/>
                    <circle cx="8" cy="8" r="1" fill="currentColor"/>
                    <circle cx="8" cy="12" r="1" fill="currentColor"/>
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform">
                A
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Panel */}
      {isProjectsPanelOpen && (
        <div 
          className="fixed top-0 h-screen w-56 bg-[#111111] backdrop-blur-md border-l border-[#1f1f1f] shadow-2xl transition-all duration-300 ease-in-out"
          style={{ 
            left: sidebarCollapsed ? '5rem' : '15rem',
            zIndex: 50
          }}
      >
        <div className="flex flex-col h-full">
          {/* Sub-Sidebar Header */}
          <div className="flex items-center justify-between px-5 py-6 border-b border-[#1f1f1f]">
            <h2 className="text-base font-semibold">Projects</h2>
            <button 
              onClick={toggleProjectsPanel}
              className="p-1 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* New Project Button */}
          <div className="px-4 py-4 border-b border-[#1f1f1f]">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#4C3BCF] to-purple-600 hover:from-[#4C3BCF]/90 hover:to-purple-600/90 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                New Project
              </button>
            </div>

          {/* Projects List */}
          <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3">
            <p className="text-xs text-gray-500 px-2 mb-2 uppercase tracking-wide">All Projects</p>
            {projects.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <p className="text-xs text-gray-500">No projects yet</p>
                <p className="text-xs text-gray-600 mt-1">Click "New Project" to create one</p>
                  </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project, idx) => (
                  <button 
                    key={project._id || project.id || idx} 
                    onClick={() => selectProject(project)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group text-left ${selectedProject?._id === project._id || selectedProject?.id === project.id ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#1a1a1a]'}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${idx % 3 === 0 ? 'bg-green-400' : idx % 3 === 1 ? 'bg-yellow-400' : 'bg-blue-400'}`}></span>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">{project.name}</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
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
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#4C3BCF] to-purple-600 hover:from-[#4C3BCF]/90 hover:to-purple-600/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-purple-400">
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
                              repo.type === 'backend' ? 'bg-blue-500/20 text-blue-400' :
                              repo.type === 'fullstack' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {repo.type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => githubConnected && setShowRepoModal(true)}
                        className="text-blue-400 hover:text-blue-300 ml-0.5 transition-colors"
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
                        className="text-blue-400 hover:text-blue-300 ml-0.5 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => githubConnected ? setShowRepoModal(true) : alert("Please connect GitHub first")}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
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
                  className={`w-8 h-8 ${githubConnected ? 'bg-blue-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30'} border rounded-lg backdrop-blur-sm flex items-center justify-center ${githubConnected ? '' : 'cursor-pointer'} transition-all p-1.5`}
                >
                  <Image 
                    src="/Images/github.png" 
                    alt="GitHub" 
                    width={20} 
                    height={20}
                    className={`w-full h-full object-contain transition-all ${!githubConnected ? 'grayscale group-hover:grayscale-0' : ''}`}
                  />
                  {githubConnected && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-[#0a0a0a]"></span>}
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  {githubConnected ? 'GitHub Connected' : 'Click to Connect GitHub'}
                </div>
              </div>
              
              {/* Jira */}
              <div className="relative group">
                <div className="w-8 h-8 bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all p-1.5">
                  <Image 
                    src="/Images/jira.png" 
                    alt="Jira" 
                    width={20} 
                    height={20}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl">
                  Jira - Not Connected
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
              
              {/* Google Calendar */}
              <div className="relative group">
                <div className="w-8 h-8 bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all p-1.5">
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-[#0a0a0a] ring-1 ring-white/10 shadow-lg"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0a0a0a] ring-1 ring-white/10 shadow-lg"></div>
            </div>
            <button className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl transition-all shadow-lg shadow-black/5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V8M8 8L11 11M8 8L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Invite</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={activePage === 'projects' ? 'h-[calc(100vh-80px)] flex flex-col w-full max-w-[1400px] mx-auto' : 'p-8 pb-16 min-h-full relative'}>
          {activePage === 'dashboard' ? (
            <>
          {/* Greeting */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Good Evening, Aditya!</h2>
              <p className="text-gray-400 text-sm">Here is today's overview</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-lg transition-all font-medium">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Import</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white text-black hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="gpu-accelerate bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-3">{stat.label}</p>
                    <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className="w-14 h-14 bg-[#1a1a1a]/50 group-hover:bg-[#222222]/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-gray-300 transition-all ml-4">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress & Activity */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Progress Report */}
            <div className="col-span-2 bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Progress report</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] rounded-lg text-gray-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 1V3M10 1V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span>May - Aug</span>
                </button>
              </div>
              <div className="h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 600 180">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#666" />
                      <stop offset="50%" stopColor="#999" />
                      <stop offset="100%" stopColor="#666" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points="20,80 80,80 140,120 200,120 260,60 320,100 380,40 440,50 500,50 560,50"
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="20,80 80,80 140,120 200,120 260,60 320,100 380,40 440,50 500,50 560,50"
                    fill="none"
                    stroke="#444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                  <text x="20" y="170" fill="#555" fontSize="12">May</text>
                  <text x="200" y="170" fill="#555" fontSize="12">June</text>
                  <text x="380" y="170" fill="#555" fontSize="12">July</text>
                  <text x="540" y="170" fill="#555" fontSize="12">Aug</text>
                  <text x="5" y="160" fill="#555" fontSize="12">0</text>
                  <text x="5" y="120" fill="#555" fontSize="12">100</text>
                  <text x="5" y="80" fill="#555" fontSize="12">200</text>
                  <text x="5" y="40" fill="#555" fontSize="12">300</text>
                  <text x="5" y="10" fill="#555" fontSize="12">400</text>
                </svg>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent activity</h3>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">View All</button>
              </div>
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10 4L4 10M4 4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-gray-400">, {activity.action}</span>
                      </p>
                    </div>
                  </div>
                ))}
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
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-white text-black hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M7 2V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Add Project</span>
              </button>
            </div>

            <table className="w-full bg-transparent">
              <thead className="bg-transparent">
                <tr className="border-b border-[#1f1f1f]/50 bg-transparent">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-transparent" />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Project name</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Creator</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Date added</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Recent updates</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 bg-transparent">Manage</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {dashboardProjects.map((project, i) => (
                  <tr key={i} className="border-b border-[#1f1f1f]/50 bg-transparent hover:bg-[#0f0f0f]/50 transition-colors">
                    <td className="px-6 py-4 bg-transparent">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-transparent" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium bg-transparent">{project.name}</td>
                    <td className="px-6 py-4 bg-transparent">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                        <span className="text-sm">{project.creator}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-transparent">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Active' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          project.status === 'Active' ? 'bg-blue-400' : 'bg-yellow-400'
                        }`}></span>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">{project.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">{project.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 bg-transparent">{project.update}</td>
                    <td className="px-6 py-4 bg-transparent">
                      <button className="text-sm text-gray-400 hover:text-white transition-colors">Manage</button>
                    </td>
                  </tr>
                ))}
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
          onClick={() => showPendingTasksApproval(selectedProject._id || selectedProject.id)}
          className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
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
                <div className="text-blue-400">⏱️ Total Time: {totalTimeline}</div>
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
                <span className="text-blue-400">⏱️ {task.timeline}</span>
              )}
              {task.deadline && (
                <span className="text-orange-400">📅 {new Date(task.deadline).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {task.role && (
            <div className="text-xs text-blue-400 mt-1">👤 {task.role}</div>
          )}
          {task.assigned_to && task.assigned_to !== 'Unassigned' && (
            <div className="text-xs text-purple-400 mt-1">👥 Assigned to: {task.assigned_to}</div>
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

            {/* Slack Channel Selection */}
            {slackConnected && slackChannels.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Slack Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                >
                  <option value="">Select a channel...</option>
                  {slackChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4 mb-6">
              {pendingTasks.map((task) => (
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

                  {/* Suggested Members */}
                  {task.suggested_members && task.suggested_members.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 mb-2">💡 Suggested Team Members:</p>
                      <div className="space-y-2">
                        {task.suggested_members.map((member, idx) => (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              taskAssignments[task.id]?.assigned_member_name === member.name
                                ? 'bg-blue-500/20 border border-blue-500/50'
                                : 'bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#3a3a3a]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`task-${task.id}`}
                              checked={taskAssignments[task.id]?.assigned_member_name === member.name}
                              onChange={() => {
                                setTaskAssignments({
                                  ...taskAssignments,
                                  [task.id]: {
                                    assigned_member_name: member.name,
                                    assigned_member_email: member.email
                                  }
                                });
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-300">{member.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  member.status === 'idle' ? 'bg-green-500/20 text-green-400' :
                                  member.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {member.status}
                                </span>
                                {member.idle_percentage !== undefined && (
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    member.idle_percentage >= 50 ? 'bg-green-500/20 text-green-400' :
                                    member.idle_percentage >= 25 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {member.idle_percentage.toFixed(1)}% idle
                                  </span>
                                )}
                                <span className="text-xs text-blue-400">Score: {member.score}</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {member.role && <span>{member.role} • </span>}
                                {member.match_reasons?.join(' • ')}
                              </div>
                              {member.skills && member.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {member.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 bg-[#0a0a0a] rounded text-gray-500">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-300">
                    {selectedRepos.length} repositories selected
                  </span>
                  <button
                    onClick={connectReposToProject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Connect Selected
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRepos.map((repo, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      {repo.name}
                      <span className="text-blue-400">({repo.type})</span>
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
                          ? 'bg-blue-500/10 backdrop-blur-sm border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'bg-[#111111]/40 backdrop-blur-sm border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/60 hover:border-[#3a3a3a]/60 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 mt-1">
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500' 
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
                              repoType === 'backend' ? 'bg-blue-500/20 text-blue-400' :
                              repoType === 'fullstack' ? 'bg-purple-500/20 text-purple-400' :
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
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
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
    </>
  );
}
