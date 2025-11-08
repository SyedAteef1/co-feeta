'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export const Integrations = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const user_id = searchParams.get('user_id');
    const team_id = searchParams.get('team_id');
    
    if (user_id && team_id) {
      localStorage.setItem('slack_user_id', user_id);
      localStorage.setItem('slack_team_id', team_id);
      window.location.href = `/dashboard`;
    }
  }, [searchParams]);

  const handleConnect = () => {
    localStorage.removeItem('slack_user_id');
    localStorage.removeItem('slack_team_id');
    window.location.href = "https://localhost:5000/slack/install";
  };

  const fetchChannels = async (user_id) => {
    setLoading(true);
    try {
      const response = await fetch(`https://localhost:5000/api/list_conversations?user_id=${user_id}`);
      const data = await response.json();
      if (data && data.channels) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
    setLoading(false);
  };

  const fetchAccountDetails = async (user_id) => {
    try {
      const response = await fetch(`https://localhost:5000/api/user_info?user_id=${user_id}`);
      const data = await response.json();
      setAccountDetails(data);
      console.log('Account Details:', data);
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Connect to Slack
          </h2>
          <p className="text-gray-600 mb-8">
            Integrate your Slack workspace to start managing conversations
          </p>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors"
              style={{
                backgroundColor: "#4A154B",
                fontSize: 16,
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.52v2.522a2.528 2.528 0 0 1-2.52 2.523Zm0-6.58A2.528 2.528 0 0 1 2.522 6.062 2.528 2.528 0 0 1 5.042 3.54a2.528 2.528 0 0 1 2.52 2.522v2.523H5.042Zm6.58 0a2.528 2.528 0 0 1-2.522-2.523A2.528 2.528 0 0 1 11.622 3.54a2.528 2.528 0 0 1 2.523 2.522v2.523h-2.523Zm0 6.58a2.528 2.528 0 0 1 2.523 2.523 2.528 2.528 0 0 1-2.523 2.522H9.1v-2.522a2.528 2.528 0 0 1 2.522-2.523Zm6.58 0a2.528 2.528 0 0 1 2.523-2.523 2.528 2.528 0 0 1 2.522 2.523 2.528 2.528 0 0 1-2.522 2.522h-2.523v-2.522Zm0-6.58a2.528 2.528 0 0 1-2.523-2.523A2.528 2.528 0 0 1 18.202 3.54a2.528 2.528 0 0 1 2.523 2.522v2.523h-2.523Z"/>
              </svg>
              Connect with Slack
            </button>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-center p-4 bg-green-100 rounded-md mb-4">
                <span className="text-green-800 font-medium">✅ Slack Connected!</span>
              </div>
              
              {accountDetails && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Account Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Workspace:</strong> {accountDetails.team_info?.team?.name || 'Unknown'}</div>
                    <div><strong>Domain:</strong> {accountDetails.team_info?.team?.domain || 'Unknown'}</div>
                    <div><strong>User:</strong> {accountDetails.user_info?.user?.real_name || accountDetails.user_info?.user?.name || 'Unknown'}</div>
                    <div><strong>Email:</strong> {accountDetails.user_info?.user?.profile?.email || 'Not available'}</div>
                    <div><strong>User ID:</strong> {userInfo.user_id}</div>
                    <div><strong>Team ID:</strong> {userInfo.team_id}</div>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Loading channels...</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Available Channels ({channels.length})</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {channels.map((channel) => (
                      <div key={channel.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex-shrink-0">
                          {channel.is_channel ? '#' : channel.is_group ? '🔒' : channel.is_im ? '👤' : '👥'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {channel.name || 'Direct Message'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {channel.is_channel ? 'Public Channel' : channel.is_group ? 'Private Channel' : channel.is_im ? 'Direct Message' : 'Group DM'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
