import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  startSession as apiStartSession,
  getActiveSession as apiGetActiveSession,
  completeSession as apiCompleteSession,
  cancelSession as apiCancelSession,
  getSessionHistory as apiGetSessionHistory,
  getStats as apiGetStats,
  createCheckIn as apiCreateCheckIn,
} from '../services/v3Api';

export interface Session {
  id: string;
  intent?: string;
  plannedDuration?: number;
  plannedDurationMinutes?: number;
  actualDuration?: number;
  actualDurationMinutes?: number;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  notes?: string;
  moodBefore?: string;
  moodAfter?: string;
}

export interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  avgMinutesPerSession: number;
  breakAttemptsTotal: number;
  breakAttemptsClosed: number;
  breakSuccessRate: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; minutes: number } | null;
  avgMood: number;
  totalCheckIns: number;
}

interface SessionState {
  // Active session
  activeSession: Session | null;
  isSessionActive: boolean;
  isStartingSession: boolean;
  plannedDurationMinutes: number;

  // History
  recentSessions: Session[];

  // Today's stats
  todayMinutes: number;
  todayBreakAttempts: number;

  // Stats
  stats: SessionStats | null;
  currentStreak: number;
  isLoadingStats: boolean;

  // Timer state
  elapsedSeconds: number;
  isTimerRunning: boolean;
  timerInterval: NodeJS.Timeout | null;

  // Actions
  loadActiveSession: () => Promise<void>;
  startSession: (intent?: string, duration?: number, mood?: string) => Promise<Session>;
  completeSession: (mood?: string, notes?: string) => Promise<void>;
  endSession: (mood?: string, notes?: string) => Promise<void>;
  cancelSession: (reason?: string) => Promise<void>;
  tick: () => void;

  loadHistory: (limit?: number) => Promise<void>;
  loadStats: (days?: number) => Promise<void>;
  loadTodayStats: () => Promise<void>;
  loadStreak: () => Promise<void>;
  loadRecentSessions: () => Promise<void>;

  // Timer
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Check-ins
  createCheckIn: (type: string, mood: string, sessionId?: string) => Promise<void>;

  // Reset
  reset: () => void;
}

const STORAGE_KEY = 'v3_session_cache';

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isSessionActive: false,
  isStartingSession: false,
  plannedDurationMinutes: 60,
  recentSessions: [],
  todayMinutes: 0,
  todayBreakAttempts: 0,
  stats: null,
  currentStreak: 0,
  isLoadingStats: false,
  elapsedSeconds: 0,
  isTimerRunning: false,
  timerInterval: null,

  loadActiveSession: async () => {
    try {
      const session = await apiGetActiveSession();
      set({
        activeSession: session,
        isSessionActive: !!session,
      });

      // Resume timer if active session
      if (session && session.status === 'active') {
        const started = new Date(session.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - started) / 1000);
        set({ elapsedSeconds: elapsed });
        get().startTimer();
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
    }
  },

  startSession: async (intent, duration = 60, mood) => {
    set({ isStartingSession: true });
    try {
      const session = await apiStartSession({
        intent,
        duration,
        mood: mood as any,
      });

      set({
        activeSession: session,
        isSessionActive: true,
        isStartingSession: false,
        elapsedSeconds: 0,
      });

      get().startTimer();

      // Save to cache
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      return session;
    } catch (error) {
      set({ isStartingSession: false });
      throw error;
    }
  },

  completeSession: async (mood, notes) => {
    const { activeSession, timerInterval } = get();
    if (!activeSession) return;

    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    try {
      await apiCompleteSession(activeSession.id, {
        mood: mood as any,
        notes,
      });

      // Create post-session check-in if mood provided
      if (mood) {
        await apiCreateCheckIn({
          type: 'post_session',
          mood: mood as any,
          sessionId: activeSession.id,
          data: { notes },
        });
      }

      set({
        activeSession: null,
        isSessionActive: false,
        isTimerRunning: false,
        timerInterval: null,
        elapsedSeconds: 0,
      });

      await AsyncStorage.removeItem(STORAGE_KEY);

      // Refresh stats
      get().loadStats();
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  },

  endSession: async (mood, notes) => {
    return get().completeSession(mood, notes);
  },

  tick: () => {
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  cancelSession: async (reason) => {
    const { activeSession, timerInterval } = get();
    if (!activeSession) return;

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    try {
      await apiCancelSession(activeSession.id, reason);

      set({
        activeSession: null,
        isSessionActive: false,
        isTimerRunning: false,
        timerInterval: null,
        elapsedSeconds: 0,
      });

      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to cancel session:', error);
      throw error;
    }
  },

  loadHistory: async (limit = 50) => {
    try {
      const history = await apiGetSessionHistory(limit);
      set({ recentSessions: history });
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  },

  loadTodayStats: async () => {
    await get().loadStats(1);
  },

  loadStreak: async () => {
    await get().loadStats(30);
  },

  loadRecentSessions: async () => {
    await get().loadHistory(10);
  },

  loadStats: async (days = 7) => {
    set({ isLoadingStats: true });
    try {
      const stats = await apiGetStats(days);
      set({
        stats,
        currentStreak: stats.currentStreak,
        todayMinutes: stats.totalMinutes,
        todayBreakAttempts: stats.breakAttemptsTotal,
        isLoadingStats: false,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      set({ isLoadingStats: false });
    }
  },

  startTimer: () => {
    const { isTimerRunning, timerInterval } = get();
    if (isTimerRunning) return;

    const interval = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);

    set({ isTimerRunning: true, timerInterval: interval });
  },

  pauseTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    set({ isTimerRunning: false, timerInterval: null });
  },

  resetTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    set({ elapsedSeconds: 0, isTimerRunning: false, timerInterval: null });
  },

  createCheckIn: async (type, mood, sessionId) => {
    try {
      await apiCreateCheckIn({
        type: type as any,
        mood: mood as any,
        sessionId,
      });
    } catch (error) {
      console.error('Failed to create check-in:', error);
    }
  },

  reset: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    set({
      activeSession: null,
      recentSessions: [],
      stats: null,
      elapsedSeconds: 0,
      isTimerRunning: false,
      timerInterval: null,
    });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

// Helper to format elapsed time
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to format duration in minutes to readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
