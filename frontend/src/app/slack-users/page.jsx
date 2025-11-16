'use client';
import { API_BASE_URL } from '@/config/api';
import { useState, useEffect } from 'react';

export default function SlackUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchSlackUsers();
  }, []);

  const fetchSlackUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || `${API_BASE_URL}`;
      console.log('Fetching from:', `${API_URL}/slack/api/list-users`);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/slack/api/list-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.real_name?.toLowerCase().includes(query.toLowerCase()) ||
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.profile?.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const checkUserStatus = async (userName) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || `${API_BASE_URL}`;
      
      const response = await fetch(`${API_URL}/slack/api/check-user-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ member_name: userName })
      });

      const data = await response.json();
      
      setUsers(prev => prev.map(user => 
        user.real_name === userName 
          ? { ...user, statusChecked: true, ...data }
          : user
      ));
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading Slack users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Slack Users</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4C3BCF]"
          />
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-400">
              Found {filteredUsers.length} matching user(s)
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {user.profile?.image_48 && (
                  <img
                    src={user.profile.image_48}
                    alt={user.real_name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <div className="font-semibold">{user.real_name}</div>
                  <div className="text-sm text-gray-400">@{user.name}</div>
                  {user.profile?.email && (
                    <div className="text-xs text-gray-500">{user.profile.email}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {user.statusChecked && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.available ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <span className="text-sm">
                      {user.available ? 'Active' : user.status || 'Offline'}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => checkUserStatus(user.real_name)}
                  className="bg-[#4C3BCF] px-4 py-2 rounded-lg hover:bg-[#4C3BCF]/80 text-sm"
                >
                  Check Status
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="text-center text-gray-400 py-12">
            No users match your search.
          </div>
        )}

        {users.length === 0 && !error && (
          <div className="text-center text-gray-400 py-12">
            No Slack users found. Make sure Slack is connected.
          </div>
        )}
      </div>
    </div>
  );
}
