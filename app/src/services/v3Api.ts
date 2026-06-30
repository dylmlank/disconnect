import axios from 'axios';
import { API_URL } from '../constants/config';
import { useToastStore } from '../store/toastStore';

// v3 API client
const v3Api = axios.create({
  baseURL: `${API_URL}/v3`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Clerk token provider — set by RootNavigator once useAuth() is available
let _getToken: (() => Promise<string | null>) | null = null;

export function setV3TokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

// Attach Clerk session token to every request
v3Api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Show toast on network errors
v3Api.interceptors.response.use(
  (response) => response,
  (error) => {
    const toast = useToastStore.getState();
    if (!error.response) {
      toast.show({ title: 'Network error', icon: '_wifi', subtitle: 'check connection' });
    }
    return Promise.reject(error);
  },
);

// ─── Onboarding & Preferences ──────────────────────────────────

export const completeOnboarding = async (data: {
  firstName: string;
  age: number;
  goals: any[];
  triggerApps: string[];
  estimatedDailyScreenTime: number;
  frictionSettings: any;
}) => {
  const response = await v3Api.post('/users/me/onboarding', data);
  return response.data;
};

export const getPreferences = async () => {
  const response = await v3Api.get('/users/me/preferences');
  return response.data;
};

export const updatePreferences = async (updates: {
  goals?: any[];
  triggerApps?: string[];
  estimatedDailyScreenTime?: number;
  frictionSettings?: any;
}) => {
  const response = await v3Api.patch('/users/me/preferences', updates);
  return response.data;
};

// ─── Sessions ───────────────────────────────────────────────

export const startSession = async (data: {
  intent?: string;
  duration: number;
  mood?: 'great' | 'good' | 'meh' | 'bad' | 'awful';
}) => {
  const response = await v3Api.post('/sessions', data);
  return response.data;
};

export const getActiveSession = async () => {
  const response = await v3Api.get('/sessions/active');
  return response.data;
};

export const completeSession = async (
  sessionId: string,
  data: {
    mood?: 'great' | 'good' | 'meh' | 'bad' | 'awful';
    notes?: string;
  },
) => {
  const response = await v3Api.post(`/sessions/${sessionId}/complete`, data);
  return response.data;
};

export const cancelSession = async (sessionId: string, reason?: string) => {
  const response = await v3Api.post(`/sessions/${sessionId}/cancel`, { reason });
  return response.data;
};

export const getSessionHistory = async (limit = 50, offset = 0) => {
  const response = await v3Api.get('/sessions', { params: { limit, offset } });
  return response.data;
};

// ─── Break Attempts ─────────────────────────────────────────

export const recordBreakAttempt = async (data: {
  appName: string;
  triggerType: 'impulse' | 'notification' | 'boredom' | 'habit' | 'other';
  frictionSteps: { step: string; completed: boolean; duration?: number }[];
  outcome: 'continued' | 'closed' | 'timeout';
  sessionId?: string;
}) => {
  const response = await v3Api.post('/break-attempts', data);
  return response.data;
};

export const getBreakAttempts = async (days = 7) => {
  const response = await v3Api.get('/break-attempts', { params: { days } });
  return response.data;
};

// ─── Stats & Insights ─────────────────────────────────────────

export const getStats = async (days = 7) => {
  const response = await v3Api.get('/stats', { params: { days } });
  return response.data;
};

// ─── Check-ins ─────────────────────────────────────────────

export const createCheckIn = async (data: {
  type: 'pre_session' | 'post_session' | 'scrolling_episode';
  mood: 'great' | 'good' | 'meh' | 'bad' | 'awful';
  sessionId?: string;
  data?: Record<string, any>;
}) => {
  const response = await v3Api.post('/checkins', data);
  return response.data;
};

export const getCheckIns = async (days = 30) => {
  const response = await v3Api.get('/checkins', { params: { days } });
  return response.data;
};

// ─── Alternatives ─────────────────────────────────────────

export const getAlternatives = async (duration = 15) => {
  const response = await v3Api.get('/alternatives', { params: { duration } });
  return response.data;
};

export default v3Api;
