import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000';
    const startTime = Date.now();

    const trackVisit = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await fetch(`${API_URL}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || null,
            path: pathname,
            referrer: document.referrer,
            duration: 0
          })
        });
      } catch (err) {
        // Silent fail - don't block UI
      }
    };

    trackVisit();

    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 2) {
        fetch(`${API_URL}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: JSON.parse(localStorage.getItem('user') || '{}').id || null,
            path: pathname,
            referrer: document.referrer,
            duration
          })
        }).catch(() => {});
      }
    };
  }, [pathname]);
}
