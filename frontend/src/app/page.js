'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernHome from './modernhome/page'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    // Ensure token is valid and not the string "undefined" or "null"
    if (token && token !== 'undefined' && token !== 'null') {
      // Redirect authenticated users to dashboard
      router.push('/demodash');
    }
  }, [router]);

  return (
    <div className="min-h-screen font-inter bg-white">
      <ModernHome />
    </div>
  )
}
