'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [allMembers, setAllMembers] = useState([]);
  const [projectTeam, setProjectTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [processingResume, setProcessingResume] = useState(false);
  const [editingWorkload, setEditingWorkload] = useState(null);

  useEffect(() => {
    fetchAllMembers();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTeam(selectedProject);
    }
  }, [selectedProject]);

  const fetchAllMembers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('https://localhost:5000/api/teams/members', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setAllMembers(data.members || []);
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('https://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProjects(data.projects || []);
  };

  const fetchProjectTeam = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`https://localhost:5000/api/teams/projects/${projectId}/team`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProjectTeam(data.team || []);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const selectedRoles = Array.from(e.target.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value);
    formData.append('selected_roles', JSON.stringify(selectedRoles));
    
    const token = localStorage.getItem('token');
    
    const res = await fetch('https://localhost:5000/api/teams/members', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (res.ok) {
      setShowAddModal(false);
      fetchAllMembers();
      e.target.reset();
    }
    setLoading(false);
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    
    const token = localStorage.getItem('token');
    await fetch(`https://localhost:5000/api/teams/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchAllMembers();
  };

  const handleUpdateWorkload = async (memberId, currentLoad, capacity) => {
    const token = localStorage.getItem('token');
    await fetch(`https://localhost:5000/api/teams/members/${memberId}/workload`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ current_load: currentLoad, capacity })
    });
    setEditingWorkload(null);
    fetchAllMembers();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">👥 Team Management</h1>
            <p className="text-gray-400">Manage your team members and track project assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            + Add Member
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-4 border-b border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            All Members ({allMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'assigned'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Project Team
          </button>
        </div>
      </div>

      {activeTab === 'assigned' && (
        <div className="max-w-7xl mx-auto mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full max-w-md bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a2a2a]"
          >
            <option value="">-- Select Project --</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'all' ? allMembers : projectTeam).map(member => (
            <div key={member._id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#2a2a2a] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {member.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-gray-400">{member.role}</p>
                  </div>
                </div>
                {activeTab === 'all' && (
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                {member.email && (
                  <div className="text-sm text-gray-400">
                    📧 {member.email}
                  </div>
                )}
                <span className={`ml-auto text-xs px-2 py-1 rounded ${
                  member.status === 'idle' ? 'bg-green-600/20 text-green-400' :
                  member.status === 'busy' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {member.idle_percentage || 0}% idle
                </span>
              </div>

              {member.selected_roles && member.selected_roles.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {member.selected_roles.map((role, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {member.experience_years > 0 && (
                <div className="text-sm text-gray-400 mb-3">
                  💼 {member.experience_years} years experience
                </div>
              )}

              {member.summary && (
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">{member.summary}</p>
              )}

              {member.skills && member.skills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-[#111111] border border-[#1a1a1a] rounded">
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 5 && (
                      <span className="text-xs px-2 py-1 text-gray-500">
                        +{member.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {member.expertise && member.expertise.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">Expertise</div>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.slice(0, 3).map((exp, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Idle Status */}
              <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Availability</span>
                  <span className={`text-xs font-medium ${
                    member.status === 'idle' ? 'text-green-400' :
                    member.status === 'busy' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {member.status === 'idle' ? '🟢 Available' :
                     member.status === 'busy' ? '🟡 Busy' :
                     '🔴 Overloaded'}
                  </span>
                </div>
                <div className="w-full bg-[#111111] rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      member.idle_percentage >= 50 ? 'bg-green-500' :
                      member.idle_percentage > 0 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${member.idle_percentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{member.idle_percentage || 0}% idle</span>
                  <span>{member.idle_hours || 0}/{member.capacity || 40}hrs free</span>
                </div>
                {activeTab === 'all' && (
                  <button
                    onClick={() => setEditingWorkload(member._id)}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                  >
                    ⚙️ Update Workload
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {editingWorkload && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Update Workload</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Current Load (hours/week)</label>
                  <input
                    type="number"
                    id="workload-load"
                    defaultValue={allMembers.find(m => m._id === editingWorkload)?.current_load || 0}
                    min="0"
                    className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Capacity (hours/week)</label>
                  <input
                    type="number"
                    id="workload-capacity"
                    defaultValue={allMembers.find(m => m._id === editingWorkload)?.capacity || 40}
                    min="1"
                    className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingWorkload(null)}
                    className="flex-1 px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const load = parseInt(document.getElementById('workload-load').value);
                      const cap = parseInt(document.getElementById('workload-capacity').value);
                      handleUpdateWorkload(editingWorkload, load, cap);
                    }}
                    className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'all' ? allMembers : projectTeam).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            {activeTab === 'all' 
              ? '📭 No team members yet. Add your first member!'
              : '📭 No members assigned to this project yet.'}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Resume (PDF/DOCX) *</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.docx,.doc"
                  required
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    setProcessingResume(true);
                    const formData = new FormData();
                    formData.append('resume', file);
                    
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('https://localhost:5000/api/teams/preview', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                      });
                      const data = await res.json();
                      if (data.suggested_roles) {
                        setSuggestedRoles(data.suggested_roles);
                      }
                    } catch (err) {
                      console.error('Preview failed:', err);
                    }
                    setProcessingResume(false);
                  }}
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a2a2a]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {processingResume ? '⏳ AI analyzing resume...' : '✨ AI will extract skills, role, and suggest matching roles'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="member@example.com"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Roles (Select multiple)
                  {suggestedRoles.length > 0 && <span className="text-xs text-green-400 ml-2">✨ AI suggested roles pre-selected</span>}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'QA Engineer', 'UI/UX Designer', 'Product Manager', 'Data Engineer'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="roles"
                        value={role}
                        defaultChecked={suggestedRoles.includes(role)}
                        className="w-4 h-4 bg-[#111111] border border-[#1a1a1a] rounded accent-purple-500"
                      />
                      <span className={suggestedRoles.includes(role) ? 'text-green-400 font-medium' : ''}>
                        {role} {suggestedRoles.includes(role) && '✨'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSuggestedRoles([]);
                  }}
                  className="flex-1 px-4 py-3 bg-[#111111] hover:bg-[#1a1a1a] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
