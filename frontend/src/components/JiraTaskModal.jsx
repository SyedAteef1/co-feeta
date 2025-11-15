'use client';
import { useState, useEffect } from 'react';

export default function JiraTaskModal({ task, onClose, onSuccess }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [issueType, setIssueType] = useState('Task');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://localhost:5000/api/jira/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading Jira projects:', error);
    }
  };

  const createIssue = async () => {
    if (!selectedProject) {
      alert('Please select a Jira project');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('https://localhost:5000/api/jira/create-issue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_key: selectedProject,
          summary: task.title,
          description: task.description,
          issue_type: issueType
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Jira issue created: ${data.issue_key}`);
        if (onSuccess) onSuccess(data);
        onClose();
      } else {
        alert(`❌ ${data.error || 'Failed to create issue'}`);
      }
    } catch (error) {
      alert('❌ Error creating issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[#2a2a2a]/50 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Create Jira Issue</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Task</label>
            <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-gray-400 mt-1">{task.description}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Jira Project *</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
            >
              <option value="">Select project...</option>
              {projects.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
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
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={createIssue}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
