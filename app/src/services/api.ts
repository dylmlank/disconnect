import axios from 'axios';
import { API_URL } from '../constants/config';
import { useToastStore } from '../store/toastStore';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Clerk token provider — set by RootNavigator once useAuth() is available
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

// Attach Clerk session token to every request
api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Show toast on network errors (but don't interrupt normal 4xx flows)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — no response from server
      useToastStore.getState().show({
        icon: '📡',
        title: 'Connection issue',
        subtitle: 'Check your internet or try again',
        color: '#f87171',
      });
    } else if (error.response.status >= 500) {
      useToastStore.getState().show({
        icon: '⚠️',
        title: 'Server error',
        subtitle: 'Something went wrong, try again later',
        color: '#f87171',
      });
    }
    return Promise.reject(error);
  },
);

export default api;
