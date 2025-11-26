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
    console.log('[Analytics] AnalyticsTracker mounted!');
    if (typeof document !== 'undefined') {
      referrerRef.current = document.referrer || 'Direct';
    }
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    let userId = null;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user.id || null;
    } catch (e) {}

    // Track page entry immediately
    const entryPayload = {
      path: currentPath,
      referrer: referrerRef.current,
      duration: 0,
      user_id: userId,
    };

    console.log('[Analytics] Page entry:', currentPath);
    
    const tryFetch = async (apiUrl, payload) => {
      try {
        const response = await fetch(`${apiUrl}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
        
        if (response.ok) {
          console.log('[Analytics] ✅ Tracked');
          return true;
        } else {
          console.error('[Analytics] ❌ Failed:', response.status);
          return false;
        }
      } catch (err) {
        console.error('[Analytics] ❌ Error:', err.message);
        return false;
      }
    };
    
    // Track entry
    tryFetch('https://localhost:5000', entryPayload).then(success => {
      if (!success) {
        tryFetch('http://localhost:5000', entryPayload);
      }
    });

    // Track exit with duration
    return () => {
      const duration = Date.now() - startTimeRef.current;
      if (duration > 100) {
        const exitPayload = { ...entryPayload, duration: duration / 1000 };
        tryFetch('https://localhost:5000', exitPayload).catch(() => {});
      }
    };
  }, [pathname, searchParams]);

  return null; // This component renders nothing
}
