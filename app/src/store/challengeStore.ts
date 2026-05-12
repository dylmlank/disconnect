import { create } from 'zustand';
import api from '../services/api';
import type { Challenge, ChallengeDetail } from '@disconnect/shared';

interface ChallengeState {
  challenges: Challenge[];
  myChallenges: Challenge[];
  currentChallenge: ChallengeDetail | null;
  isLoading: boolean;

  fetchChallenges: (type: 'public' | 'mine', lat?: number, lng?: number) => Promise<void>;
  fetchChallenge: (id: string) => Promise<void>;
  createChallenge: (data: {
    title: string;
    description?: string | null;
    durationDays: number;
    dailyRequirement: string;
    category: string;
    researchNote?: string | null;
    startsAt: string;
    isPublic: boolean;
    circleId?: string | null;
    lat?: number | null;
    lng?: number | null;
  }) => Promise<string>;
  joinChallenge: (id: string) => Promise<void>;
  logDay: (id: string, dayNumber: number, completed: boolean, photoUrl?: string | null) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  myChallenges: [],
  currentChallenge: null,
  isLoading: false,

  fetchChallenges: async (type, lat, lng) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = { type };
      if (type === 'public' && lat != null && lng != null) {
        params.lat = String(lat);
        params.lng = String(lng);
      }
      const { data } = await api.get('/challenges', { params });
      if (type === 'mine') {
        set({ myChallenges: data.challenges });
      } else {
        set({ challenges: data.challenges });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChallenge: async (id) => {
    const { data } = await api.get(`/challenges/${id}`);
    set({ currentChallenge: data.challenge });
  },

  createChallenge: async (challengeData) => {
    const { data } = await api.post('/challenges', challengeData);
    return data.id as string;
  },

  joinChallenge: async (id) => {
    await api.post(`/challenges/${id}/join`);
  },

  logDay: async (id, dayNumber, completed, photoUrl) => {
    await api.post(`/challenges/${id}/log`, { dayNumber, completed, photoUrl });
  },
}));
