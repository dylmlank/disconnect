import { create } from 'zustand';
import api from '../services/api';
import type { Circle, CircleDetail, CircleFeedItem } from '@disconnect/shared';

interface CircleState {
  circles: Circle[];
  currentCircle: CircleDetail | null;
  groupStreak: number;
  feed: CircleFeedItem[];
  isLoading: boolean;

  fetchCircles: () => Promise<void>;
  fetchCircle: (id: string) => Promise<void>;
  fetchFeed: (id: string) => Promise<void>;
  createCircle: (name: string) => Promise<string>;
  joinCircle: (inviteCode: string) => Promise<void>;
  leaveCircle: (id: string) => Promise<void>;
}

export const useCircleStore = create<CircleState>((set) => ({
  circles: [],
  currentCircle: null,
  groupStreak: 0,
  feed: [],
  isLoading: false,

  fetchCircles: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/circles');
      set({ circles: data.circles });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCircle: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/circles/${id}`);
      set({ currentCircle: data.circle, groupStreak: data.groupStreak ?? 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeed: async (id) => {
    try {
      const { data } = await api.get(`/circles/${id}/feed`);
      set({ feed: data.activity });
    } catch {
      // silent
    }
  },

  createCircle: async (name) => {
    const { data } = await api.post('/circles', { name });
    set((state) => ({ circles: [...state.circles, data.circle] }));
    return data.circle.id;
  },

  joinCircle: async (inviteCode) => {
    const { data } = await api.post('/circles/join', { inviteCode });
    set((state) => ({ circles: [...state.circles, data.circle] }));
  },

  leaveCircle: async (id) => {
    await api.delete(`/circles/${id}/leave`);
    set((state) => ({
      circles: state.circles.filter((c) => c.id !== id),
      currentCircle: state.currentCircle?.id === id ? null : state.currentCircle,
    }));
  },
}));
