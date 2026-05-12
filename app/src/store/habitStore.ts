import { create } from 'zustand';
import api from '../services/api';
import type { UserHabit, HabitLog, HabitStreak } from '@disconnect/shared';

interface HabitState {
  habits: UserHabit[];
  todayLogs: HabitLog[];
  streaks: HabitStreak[];
  isLoading: boolean;

  fetchHabits: () => Promise<void>;
  addHabit: (habitId: string, customName?: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  logHabit: (habitId: string) => Promise<void>;
  unlogHabit: (habitId: string, date: string) => Promise<void>;
  fetchStreaks: () => Promise<void>;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  todayLogs: [],
  streaks: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/habits');
      set({ habits: data.habits, todayLogs: data.todayLogs });
    } finally {
      set({ isLoading: false });
    }
  },

  addHabit: async (habitId, customName) => {
    const { data } = await api.post('/habits', { habitId, customName });
    set((state) => ({ habits: [...state.habits, data.habit] }));
  },

  removeHabit: async (habitId) => {
    await api.delete(`/habits/${habitId}`);
    set((state) => ({
      habits: state.habits.filter((h) => h.habitId !== habitId),
      todayLogs: state.todayLogs.filter((l) => l.habitId !== habitId),
    }));
  },

  logHabit: async (habitId) => {
    const { data } = await api.post(`/habits/${habitId}/log`);
    set((state) => {
      const alreadyLogged = state.todayLogs.some((l) => l.habitId === habitId);
      return {
        todayLogs: alreadyLogged ? state.todayLogs : [...state.todayLogs, data.log],
      };
    });
  },

  unlogHabit: async (habitId, date) => {
    await api.delete(`/habits/${habitId}/log/${date}`);
    set((state) => ({
      todayLogs: state.todayLogs.filter((l) => !(l.habitId === habitId && l.loggedDate === date)),
    }));
  },

  fetchStreaks: async () => {
    const { data } = await api.get('/habits/streaks');
    set({ streaks: data.streaks });
  },
}));
