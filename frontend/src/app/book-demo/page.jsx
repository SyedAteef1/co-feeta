'use client';
import { API_BASE_URL } from '@/config/api';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function BookDemo() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const teamSizes = [
    '1-5 people',
    '6-10 people',
    '11-20 people',
    '21-50 people',
    '51-100 people',
    '100+ people'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || `${API_BASE_URL}`;
      const response = await fetch(`${API_URL}/api/demo/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to book demo');
      }

      setSubmitted(true);
      setTimeout(() => router.push('/'), 5000);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      setLoading(false);
    }
  };

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
      
      <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'CustomFont, sans-serif' }}>
        <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-20 py-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <Image src="/Images/F2.png" alt="Feeta Logo" width={32} height={32} className="rounded-md" />
            <div className="text-xl sm:text-2xl font-extrabold">Feeta AI</div>
          </div>
        </nav>

        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          {!submitted ? (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-center">Book Your Demo</h1>
              <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base">
                See how Feeta can transform your team's execution
              </p>

              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4C3BCF] text-sm sm:text-base"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4C3BCF] text-sm sm:text-base"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4C3BCF] text-sm sm:text-base"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Size *</label>
                  <select
                    required
                    value={formData.teamSize}
                    onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4C3BCF] text-sm sm:text-base"
                  >
                    <option value="">Select team size</option>
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">You Have Booked the Demo!</h2>
              <p className="text-gray-400 mb-8 text-sm sm:text-base px-4">
                Wait for some time, we will connect you back shortly.
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Redirecting to home...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
