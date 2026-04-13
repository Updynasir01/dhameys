// src/lib/api.ts — Dhameys Frontend API Client
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];
function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
}

api.interceptors.response.use(r => r, async (error: AxiosError) => {
  const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
  if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
  if (isRefreshing) return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
    .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
  original._retry = true; isRefreshing = true;
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: nr } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', nr);
    processQueue(null, accessToken);
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api(original);
  } catch (err) {
    processQueue(err, null);
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
    if (typeof window !== 'undefined') window.location.href = '/login';
    return Promise.reject(err);
  } finally { isRefreshing = false; }
});

export const authApi = {
  register: (d: object) => api.post('/auth/register', d),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: (body?: { refreshToken?: string | null }) => api.post('/auth/logout', body ?? {}),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (code: string) => api.post('/auth/2fa/enable', { code }),
  verify2FA: (tempToken: string, code: string) => api.post('/auth/2fa/verify', { tempToken, code }),
  disable2FA: (password: string) => api.post('/auth/2fa/disable', { password }),
};

export const flightApi = {
  search: (params: object) => api.get('/search/flights', { params }),
  autocomplete: (q: string) => api.get('/search/autocomplete', { params: { q } }),
  getById: (id: string) => api.get(`/flights/${id}`),
  getSeatMap: (id: string) => api.get(`/flights/${id}/seats`),
};

export const bookingApi = {
  create: (d: object) => api.post('/bookings', d),
  get: (ref: string) => api.get(`/bookings/${ref}`),
  cancel: (ref: string, reason?: string) => api.post(`/bookings/${ref}/cancel`, { reason }),
};

export const paymentApi = {
  createIntent: (bookingId: string, currency?: string) => api.post('/payments/intent', { bookingId, currency }),
  confirm: (paymentIntentId: string) => api.post('/payments/confirm', { paymentIntentId }),
  refund: (ref: string, reason?: string) => api.post(`/payments/${ref}/refund`, { reason }),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (d: object) => api.put('/users/me', d),
  changePassword: (d: object) => api.post('/users/me/change-password', d),
  getLoyalty: () => api.get('/users/me/loyalty'),
  getBookings: (p?: object) => api.get('/users/me/bookings', { params: p }),
  getNotifications: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  deleteAccount: () => api.delete('/users/me'),
};

export const ticketApi = {
  getForBooking: (ref: string) => api.get(`/tickets/${ref}`),
  getPDF: (id: string) => api.get(`/tickets/${id}/pdf`, { responseType: 'blob' }),
  checkIn: (bookingRef: string, passengerId: string) => api.post('/checkin', { bookingRef, passengerId }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getFlights: (p?: object) => api.get('/admin/flights', { params: p }),
  listFlights: (p?: object) => api.get('/admin/flights', { params: p }),
  createFlight: (d: object) => api.post('/admin/flights', d),
  updateFlight: (id: string, d: object) => api.put(`/admin/flights/${id}`, d),
  deleteFlight: (id: string) => api.delete(`/admin/flights/${id}`),
  getUsers: (p?: object) => api.get('/admin/users', { params: p }),
  listUsers: (p?: object) => api.get('/admin/users', { params: p }),
  suspendUser: (id: string) => api.post(`/admin/users/${id}/suspend`),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  getBookings: (p?: object) => api.get('/admin/bookings', { params: p }),
  /** Alias for admin bookings list */
  listBookings: (p?: object) => api.get('/admin/bookings', { params: p }),
  getPromos: () => api.get('/admin/promos'),
  createPromo: (d: object) => api.post('/admin/promos', d),
  getRevenue: (p?: object) => api.get('/admin/reports/revenue', { params: p }),
  getRouteReport: () => api.get('/admin/reports/routes'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: string) => api.put(`/admin/settings/${key}`, { value }),
};
