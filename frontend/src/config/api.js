// Auto-detect environment and use appropriate API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://co-feeta.onrender.com'
    : 'https://localhost:5000');
