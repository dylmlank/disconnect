import { create } from 'zustand';
import api from '../services/api';
import type { User } from '@disconnect/shared';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  createProfile: (data: { firstName: string; dateOfBirth: string; bio?: string; interests: string[] }) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  createProfile: async (profileData) => {
    const { data } = await api.post('/auth/create-profile', profileData);
    set({ user: data.user });
  },

  fetchMe: async () => {
    const { data } = await api.get('/users/me');
    set({ user: data.user });
  },
}));
