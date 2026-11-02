const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOpts,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authApi = {
  register: (name: string, email: string, password: string) =>
    fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (googleToken: string) =>
    fetchApi('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    }),

  verifyOtp: (email: string, otp: string) =>
    fetchApi('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  forgotPassword: (email: string) =>
    fetchApi('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    fetchApi('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    }),

  getMe: (token: string) =>
    fetchApi('/api/auth/me', { token }),

  updateProfile: (token: string, data: { name?: string; avatar?: string }) =>
    fetchApi('/api/auth/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),
};

// Scan API
export const scanApi = {
  scanUrl: (token: string, url: string) =>
    fetchApi('/api/scan/url', {
      method: 'POST',
      token,
      body: JSON.stringify({ url }),
    }),

  getHistory: (token: string, page = 1, limit = 20) =>
    fetchApi(`/api/scan/history?page=${page}&limit=${limit}`, { token }),

  getResult: (token: string, scanId: string) =>
    fetchApi(`/api/scan/result/${scanId}`, { token }),

  submitFeedback: (token: string, scanId: string, isCorrect: boolean, comment?: string) =>
    fetchApi('/api/scan/feedback', {
      method: 'POST',
      token,
      body: JSON.stringify({ scan_id: scanId, is_correct: isCorrect, comment }),
    }),

  deleteScan: (token: string, scanId: string) =>
    fetchApi(`/api/scan/history/${scanId}`, {
      method: 'DELETE',
      token,
    }),
};

// Admin API
export const adminApi = {
  getStats: (token: string) =>
    fetchApi('/api/admin/stats', { token }),

  getUsers: (token: string, page = 1) =>
    fetchApi(`/api/admin/users?page=${page}`, { token }),

  updateUserRole: (token: string, userId: string, role: string) =>
    fetchApi(`/api/admin/users/${userId}/role?role=${role}`, {
      method: 'PUT',
      token,
    }),

  deleteUser: (token: string, userId: string) =>
    fetchApi(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      token,
    }),

  getBlockedDomains: (token: string) =>
    fetchApi('/api/admin/blocked-domains', { token }),

  addBlockedDomain: (token: string, domain: string, reason?: string) =>
    fetchApi('/api/admin/blocked-domains', {
      method: 'POST',
      token,
      body: JSON.stringify({ domain, reason }),
    }),

  removeBlockedDomain: (token: string, domainId: string) =>
    fetchApi(`/api/admin/blocked-domains/${domainId}`, {
      method: 'DELETE',
      token,
    }),

  retrainModel: (token: string) =>
    fetchApi('/api/admin/retrain-model', {
      method: 'POST',
      token,
    }),

  getLogs: (token: string, page = 1) =>
    fetchApi(`/api/admin/logs?page=${page}`, { token }),

  getAllScans: (token: string, page = 1, statusFilter?: string) =>
    fetchApi(`/api/admin/all-scans?page=${page}${statusFilter ? `&status_filter=${statusFilter}` : ''}`, { token }),
};
