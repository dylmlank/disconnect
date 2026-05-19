import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  load: () => Promise<void>;
}

const STORAGE_KEY = '@disconnect_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',

  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: next });
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  },

  load: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ mode: saved });
      }
    } catch {}
  },
}));

// Color tokens for both modes
export const themes: { dark: ThemeColors; light: ThemeColors } = {
  dark: {
    bg: '#0a0a0a',
    bgSecondary: '#111',
    card: '#1a1a1a',
    cardBorder: '#222',
    text: '#fff',
    textSecondary: '#888',
    textMuted: '#555',
    accent: '#4ade80',
    accentBg: '#0a2a0a',
    tabBar: '#0a0a0a',
    tabBorder: '#141414',
    separator: '#1a1a1a',
    inputBg: '#1a1a1a',
    inputBorder: '#262626',
  },
  light: {
    bg: '#f8f9fa',
    bgSecondary: '#fff',
    card: '#fff',
    cardBorder: '#e5e7eb',
    text: '#111',
    textSecondary: '#555',
    textMuted: '#888',
    accent: '#16a34a',
    accentBg: '#dcfce7',
    tabBar: '#fff',
    tabBorder: '#e5e7eb',
    separator: '#e5e7eb',
    inputBg: '#f3f4f6',
    inputBorder: '#d1d5db',
  },
};

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  tabBar: string;
  tabBorder: string;
  separator: string;
  inputBg: string;
  inputBorder: string;
}

export function useColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return themes[mode];
}
