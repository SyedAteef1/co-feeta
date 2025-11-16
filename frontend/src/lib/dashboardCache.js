// Dashboard caching utility - 30 second cache
const CACHE_KEY = 'feeta_dashboard_cache';
const CACHE_DURATION = 30000; // 30 seconds

export const getCachedDashboard = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

export const setCachedDashboard = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {}
};

export const clearDashboardCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
};
