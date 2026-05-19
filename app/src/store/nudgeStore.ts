import { create } from 'zustand';
import api from '../services/api';

interface CircleMemberActivity {
  userId: string;
  firstName: string;
  photoUrl: string | null;
  activeToday: boolean;
  habitLogged: boolean;
  checkedIn: boolean;
  focused: boolean;
}

interface NudgeItem {
  id: string;
  fromUserId: string;
  fromName: string;
  fromPhoto: string | null;
  toUserId: string;
  circleId: string;
  message: string;
  createdAt: string;
}

interface NudgeStore {
  nudges: NudgeItem[];
  circleActivity: CircleMemberActivity[];
  loading: boolean;

  fetchNudges: () => Promise<void>;
  fetchCircleActivity: (circleId: string) => Promise<void>;
  sendNudge: (toUserId: string, circleId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
}

export const useNudgeStore = create<NudgeStore>((set) => ({
  nudges: [],
  circleActivity: [],
  loading: false,

  fetchNudges: async () => {
    try {
      const { data } = await api.get('/nudges');
      set({ nudges: data.nudges });
    } catch {}
  },

  fetchCircleActivity: async (circleId: string) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/nudges/circle/${circleId}/activity`);
      set({ circleActivity: data.members, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  sendNudge: async (toUserId: string, circleId: string, message?: string) => {
    try {
      await api.post('/nudges', { toUserId, circleId, message });
      return { success: true };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send nudge';
      return { success: false, error: msg };
    }
  },
}));
