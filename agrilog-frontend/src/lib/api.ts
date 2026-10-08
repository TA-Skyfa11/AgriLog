export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // Khi chạy trên domain thực tế (như agrilog.io.vn)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (
        envUrl &&
        !envUrl.includes('localhost') &&
        !envUrl.includes('127.0.0.1')
      ) {
        return envUrl.replace(/\/$/, '');
      }
      // Dùng proxy /api cùng domain để tránh CORS và Mixed Content
      return `${origin}/api`;
    }
  }

  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
};

export const API_URL = getApiUrl();

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = getApiUrl();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/';
      return { success: false, message: 'Unauthorized' };
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
