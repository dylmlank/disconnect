import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'disconnect_screen_time';
const NUDGE_THRESHOLD_SECONDS = 300; // 5 minutes

interface ScreenTimeData {
  [date: string]: number; // seconds
}

export function useScreenTime() {
  const sessionStart = useRef(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    loadWeeklyTotal();

    // Track session time
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      setSessionSeconds(elapsed);

      if (elapsed >= NUDGE_THRESHOLD_SECONDS && elapsed % NUDGE_THRESHOLD_SECONDS < 2) {
        setShowNudge(true);
      }
    }, 1000);

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
      saveSessionTime();
    };
  }, []);

  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'background' || state === 'inactive') {
      saveSessionTime();
    } else if (state === 'active') {
      sessionStart.current = Date.now();
    }
  };

  const saveSessionTime = async () => {
    try {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const data: ScreenTimeData = stored ? JSON.parse(stored) : {};

      data[today] = (data[today] || 0) + elapsed;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      sessionStart.current = Date.now();
      loadWeeklyTotal();
    } catch {
      // ignore storage errors
    }
  };

  const loadWeeklyTotal = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data: ScreenTimeData = JSON.parse(stored);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      let totalSeconds = 0;
      for (const [date, seconds] of Object.entries(data)) {
        if (new Date(date) >= weekAgo) {
          totalSeconds += seconds;
        }
      }

      setWeeklyMinutes(Math.round(totalSeconds / 60));
    } catch {
      // ignore
    }
  };

  const dismissNudge = () => setShowNudge(false);

  return { sessionSeconds, weeklyMinutes, showNudge, dismissNudge };
}
