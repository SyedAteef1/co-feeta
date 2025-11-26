'use client';

import { useState, useEffect } from 'react';
import { Shield, Monitor, Globe } from 'lucide-react';

export default function AccessLogs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000'}/api/analytics/founder/access-logs`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Founder Analytics Access Logs
          </h1>
          <p className="text-gray-500 mt-2">Track who's accessing your analytics - separated by environment</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Accesses</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data?.total_accesses || 0}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Local Accesses
            </h3>
            <p className="text-3xl font-bold text-blue-900 mt-2">{data?.local_accesses?.count || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Deployment Accesses
            </h3>
            <p className="text-3xl font-bold text-green-900 mt-2">{data?.deployment_accesses?.count || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Local Accesses */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Local Environment
              </h2>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {data?.local_accesses?.logs?.length > 0 ? (
                data.local_accesses.logs.map((log, i) => (
                  <div key={i} className="border-b border-gray-200 py-3 text-sm">
                    <div className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="text-gray-600 mt-1">IP: {log.ip}</div>
                    <div className="text-gray-600">Host: {log.host}</div>
                    <div className="text-gray-500 text-xs mt-1 truncate">{log.user_agent}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No local accesses yet</p>
              )}
            </div>
          </div>

          {/* Deployment Accesses */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Deployment Environment
              </h2>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {data?.deployment_accesses?.logs?.length > 0 ? (
                data.deployment_accesses.logs.map((log, i) => (
                  <div key={i} className="border-b border-gray-200 py-3 text-sm">
                    <div className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="text-gray-600 mt-1">IP: {log.ip}</div>
                    <div className="text-gray-600">Host: {log.host}</div>
                    {log.origin && <div className="text-gray-600">Origin: {log.origin}</div>}
                    <div className="text-gray-500 text-xs mt-1 truncate">{log.user_agent}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No deployment accesses yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
