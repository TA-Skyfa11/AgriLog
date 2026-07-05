const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      // Don't redirect if it's a login failure
      if (endpoint !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        window.location.href = '/';
      }
      throw new Error(data.message || 'Sai thông tin đăng nhập');
    }
    throw new Error(data.message || 'Đã có lỗi xảy ra');
  }

  return data;
};
