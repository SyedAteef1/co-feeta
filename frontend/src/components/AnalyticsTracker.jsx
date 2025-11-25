'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startTimeRef = useRef(Date.now());
  const referrerRef = useRef('');

  // Capture referrer only once on initial load
  useEffect(() => {
    if (typeof document !== 'undefined') {
      referrerRef.current = document.referrer || 'Direct';
    }
  }, []);

  useEffect(() => {
    // Reset start time on path change
    startTimeRef.current = Date.now();
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // Function to send data
    const sendData = (duration) => {
      // Don't track if duration is negligible (e.g. rapid redirects)
      if (duration < 100) return;

      const payload = {
        path: currentPath,
        referrer: referrerRef.current,
        duration: duration / 1000, // Convert to seconds
        user_id: localStorage.getItem('user_id'), // Simple check if user is logged in
      };

      // Use navigator.sendBeacon for reliability on unload, or fetch otherwise
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000'}/api/analytics/track`;
      
      try {
        // Use fetch with keepalive if supported (modern replacement for sendBeacon)
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(err => console.error('[Analytics] Error:', err));
      } catch (e) {
        console.error('[Analytics] Exception:', e);
      }
    };

    // Cleanup function runs when component unmounts or path changes
    return () => {
      const duration = Date.now() - startTimeRef.current;
      sendData(duration);
    };
  }, [pathname, searchParams]);

  return null; // This component renders nothing
}
