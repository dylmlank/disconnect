import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GoalType, UserGoal, FrictionLevel, FrictionSettings } from '@disconnect/shared';
import {
  getPreferences,
  completeOnboarding as apiCompleteOnboarding,
  updatePreferences as apiUpdatePreferences,
} from '../services/v3Api';

interface UserProfile {
  id: string;
  firstName: string;
  age: number;
  email?: string;
  createdAt: string;
}

interface UserPreferencesState {
  // Profile
  profile: UserProfile | null;
  isLoading: boolean;

  // Goals (selected during onboarding)
  goals: UserGoal[];

  // Trigger apps
  triggerApps: string[];

  // Screen time estimate
  estimatedDailyScreenTime: number;

  // Friction settings
  frictionSettings: FrictionSettings;

  // Onboarding
  hasCompletedOnboarding: boolean;

  // Session preferences
  defaultSessionDuration: number;

  // Notifications
  notificationsEnabled: boolean;
  weeklySummaryEnabled: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  setProfile: (profile: Partial<UserProfile>) => void;

  setGoals: (goals: UserGoal[]) => Promise<void>;
  addGoal: (goal: UserGoal) => void;
  removeGoal: (type: GoalType) => void;

  setTriggerApps: (apps: string[]) => Promise<void>;
  addTriggerApp: (app: string) => void;
  removeTriggerApp: (app: string) => void;

  setEstimatedDailyScreenTime: (hours: number) => void;

  setFrictionSettings: (settings: Partial<FrictionSettings>) => void;
  setFrictionLevel: (level: FrictionLevel) => void;

  completeOnboarding: (data: OnboardingData) => Promise<void>;

  setDefaultSessionDuration: (minutes: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWeeklySummaryEnabled: (enabled: boolean) => void;

  reset: () => void;
}

interface OnboardingData {
  firstName: string;
  age: number;
  goals: UserGoal[];
  triggerApps: string[];
  estimatedDailyScreenTime: number;
  frictionSettings: FrictionSettings;
}

const STORAGE_KEY = 'v3_user_preferences';
const DEFAULT_FRICTION: FrictionSettings = {
  level: 'moderate',
  pauseEnabled: true,
  mirrorEnabled: true,
  countdownEnabled: true,
  costEnabled: true,
  countdownSeconds: 10,
};

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  profile: null,
  isLoading: true,
  goals: [],
  triggerApps: [],
  estimatedDailyScreenTime: 3,
  frictionSettings: DEFAULT_FRICTION,
  hasCompletedOnboarding: false,
  defaultSessionDuration: 60,
  notificationsEnabled: true,
  weeklySummaryEnabled: true,

  loadProfile: async () => {
    try {
      // Try to load from local storage first
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          ...parsed,
          isLoading: false,
        });
        return;
      }

      // Try to load from API
      const response = await getPreferences();
      if (response) {
        set({
          profile: response.profile,
          goals: response.goals ?? [],
          triggerApps: response.triggerApps ?? [],
          estimatedDailyScreenTime: response.estimatedDailyScreenTime ?? 3,
          frictionSettings: response.frictionSettings ?? DEFAULT_FRICTION,
          hasCompletedOnboarding: true,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...profile } : null,
    }));
    saveToStorage(get());
  },

  setGoals: async (goals) => {
    set({ goals });
    saveToStorage(get());

    try {
      await apiUpdatePreferences({ goals });
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  },

  addGoal: (goal) => {
    set((state) => ({
      goals: [...state.goals.filter((g) => g.type !== goal.type), goal],
    }));
    saveToStorage(get());
  },

  removeGoal: (type) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.type !== type),
    }));
    saveToStorage(get());
  },

  setTriggerApps: async (apps) => {
    set({ triggerApps: apps });
    saveToStorage(get());

    try {
      await apiUpdatePreferences({ triggerApps: apps });
    } catch (error) {
      console.error('Failed to save trigger apps:', error);
    }
  },

  addTriggerApp: (app) => {
    set((state) => ({
      triggerApps: [...new Set([...state.triggerApps, app])],
    }));
    saveToStorage(get());
  },

  removeTriggerApp: (app) => {
    set((state) => ({
      triggerApps: state.triggerApps.filter((a) => a !== app),
    }));
    saveToStorage(get());
  },

  setEstimatedDailyScreenTime: (hours) => {
    set({ estimatedDailyScreenTime: hours });
    saveToStorage(get());
  },

  setFrictionSettings: (settings) => {
    set((state) => ({
      frictionSettings: { ...state.frictionSettings, ...settings },
    }));
    saveToStorage(get());
  },

  setFrictionLevel: (level) => {
    const presets: Record<FrictionLevel, Partial<FrictionSettings>> = {
      gentle: {
        pauseEnabled: true,
        mirrorEnabled: false,
        countdownEnabled: false,
        costEnabled: false,
        countdownSeconds: 5,
      },
      moderate: {
        pauseEnabled: true,
        mirrorEnabled: true,
        countdownEnabled: true,
        costEnabled: true,
        countdownSeconds: 10,
      },
      firm: {
        pauseEnabled: true,
        mirrorEnabled: true,
        countdownEnabled: true,
        costEnabled: true,
        countdownSeconds: 20,
      },
    };

    set((state) => ({
      frictionSettings: {
        ...state.frictionSettings,
        level,
        ...presets[level],
      },
    }));
    saveToStorage(get());
  },

  completeOnboarding: async (data: OnboardingData) => {
    set({
      profile: {
        id: 'local',
        firstName: data.firstName,
        age: data.age,
        createdAt: new Date().toISOString(),
      },
      goals: data.goals,
      triggerApps: data.triggerApps,
      estimatedDailyScreenTime: data.estimatedDailyScreenTime,
      frictionSettings: data.frictionSettings,
      hasCompletedOnboarding: true,
    });

    saveToStorage(get());

    try {
      await apiCompleteOnboarding(data);
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  },

  setDefaultSessionDuration: (minutes) => {
    set({ defaultSessionDuration: minutes });
    saveToStorage(get());
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    saveToStorage(get());
  },

  setWeeklySummaryEnabled: (enabled) => {
    set({ weeklySummaryEnabled: enabled });
    saveToStorage(get());
  },

  reset: () => {
    AsyncStorage.removeItem(STORAGE_KEY);
    set({
      profile: null,
      goals: [],
      triggerApps: [],
      estimatedDailyScreenTime: 3,
      frictionSettings: DEFAULT_FRICTION,
      hasCompletedOnboarding: false,
      defaultSessionDuration: 60,
      notificationsEnabled: true,
      weeklySummaryEnabled: true,
    });
  },
}));

// Helper to save state to AsyncStorage
async function saveToStorage(state: UserPreferencesState) {
  const toSave = {
    profile: state.profile,
    goals: state.goals,
    triggerApps: state.triggerApps,
    estimatedDailyScreenTime: state.estimatedDailyScreenTime,
    frictionSettings: state.frictionSettings,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    defaultSessionDuration: state.defaultSessionDuration,
    notificationsEnabled: state.notificationsEnabled,
    weeklySummaryEnabled: state.weeklySummaryEnabled,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}
