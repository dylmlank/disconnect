import { create } from 'zustand';
import api from '../services/api';
import type { FocusSession } from '@disconnect/shared';

interface FocusState {
  activeSession: FocusSession | null;
  activeSessions: FocusSession[];
  history: FocusSession[];
  isLoading: boolean;

  startSession: (durationMinutes: number, intention?: string, circleId?: string) => Promise<FocusSession>;
  completeSession: (id: string) => Promise<void>;
  cancelSession: (id: string) => Promise<void>;
  fetchActive: (circleId?: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useFocusStore = create<FocusState>((set) => ({
  activeSession: null,
  activeSessions: [],
  history: [],
  isLoading: false,

  startSession: async (durationMinutes, intention, circleId) => {
    const { data } = await api.post('/focus', { durationMinutes, intention, circleId });
    set({ activeSession: data.session });
    return data.session as FocusSession;
  },

  completeSession: async (id) => {
    await api.post(`/focus/${id}/complete`);
    set({ activeSession: null });
  },

  cancelSession: async (id) => {
    await api.post(`/focus/${id}/cancel`);
    set({ activeSession: null });
  },

  fetchActive: async (circleId) => {
    set({ isLoading: true });
    try {
      const params = circleId ? `?circleId=${circleId}` : '';
      const { data } = await api.get(`/focus/active${params}`);
      set({ activeSessions: data.sessions });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/focus/history');
      set({ history: data.sessions });
    } finally {
      set({ isLoading: false });
    }
  },
}));
