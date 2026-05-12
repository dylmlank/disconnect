import { useEffect, useRef, useState, useCallback } from 'react';

interface UseFocusTimerOptions {
  durationMinutes: number;
  onComplete?: () => void;
}

interface UseFocusTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useFocusTimer({ durationMinutes, onComplete }: UseFocusTimerOptions): UseFocusTimerReturn {
  const totalSeconds = durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref current without re-triggering effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clear interval helper
  const clearTick = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTick();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTick;
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), []);

  const start = useCallback(() => {
    if (timeLeft > 0) setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  return { timeLeft, isRunning, start, pause, reset };
}
