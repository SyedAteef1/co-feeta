'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernHome from './modernhome/page'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect authenticated users to dashboard
      router.push('/demodash');
    }
  }, [router]);

  return (
    <div className="min-h-screen font-inter bg-white">
      <ModernHome/>
    </div>
  )
}
