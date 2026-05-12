import { create } from 'zustand';
import api from '../services/api';
import type { CheckIn } from '@disconnect/shared';

interface CheckInState {
  today: CheckIn | null;
  history: CheckIn[];
  isLoading: boolean;

  fetchToday: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  submitCheckIn: (data: {
    mood: number;
    goodThing1: string;
    goodThing2: string;
    goodThing3: string;
    intention?: string;
  }) => Promise<void>;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  today: null,
  history: [],
  isLoading: false,

  fetchToday: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/checkins/today');
      set({ today: data.checkIn });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    const { data } = await api.get('/checkins');
    set({ history: data.checkIns });
  },

  submitCheckIn: async (checkInData) => {
    const { data } = await api.post('/checkins', checkInData);
    set((state) => ({
      today: data.checkIn,
      history: [data.checkIn, ...state.history],
    }));
  },
}));
