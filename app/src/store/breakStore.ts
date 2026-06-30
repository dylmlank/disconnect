import { create } from 'zustand';
import { type BreakAttempt, ImpulseTrigger } from '@disconnect/shared';

interface BreakState {
  // Current break attempt
  isBreakFlowActive: boolean;
  step: 'pause' | 'mirror' | 'countdown' | 'complete' | null;
  appId: string | null;
  appName: string | null;
  sessionId: string | null;

  // Step data
  typedReason: string;
  mirrorStat: string | null;
  streakAtRisk: number | null;
  countdownSeconds: number;

  // Countdown state
  countdownRemaining: number;

  // Break history
  todayBreakAttempts: number;
  recentBreaks: BreakAttempt[];

  // Actions
  startBreakFlow: (appId: string, appName: string, sessionId?: string) => void;
  setTypedReason: (reason: string) => void;
  submitPause: () => void;
  submitMirror: () => void;
  startCountdown: () => void;
  tickCountdown: () => void;
  cancelBreak: () => void;
  completeBreak: (wasEmergency?: boolean) => void;
  closeBreakFlow: () => void;

  // Data loading
  loadBreakHistory: () => Promise<void>;
}

const FRICTION_COUNTDOWN_SECONDS = 10;

// Mirror stats to show during break flow
const MIRROR_STATS = [
  (attempts: number) => `You've already broken ${attempts} time${attempts > 1 ? 's' : ''} today.`,
  (attempts: number) => `Most people who break ${attempts}+ times report feeling worse afterward.`,
  (attempts: number) => `Your average mood after scrolling: 2.3/5`,
  (attempts: number) => `You've said "just 5 minutes" ${attempts} times today.`,
];

export const useBreakStore = create<BreakState>((set, get) => ({
  isBreakFlowActive: false,
  step: null,
  appId: null,
  appName: null,
  sessionId: null,
  typedReason: '',
  mirrorStat: null,
  streakAtRisk: null,
  countdownSeconds: FRICTION_COUNTDOWN_SECONDS,
  countdownRemaining: FRICTION_COUNTDOWN_SECONDS,
  todayBreakAttempts: 0,
  recentBreaks: [],

  startBreakFlow: (appId: string, appName: string, sessionId?: string) => {
    const { todayBreakAttempts, streakAtRisk } = get();

    // Pick a random mirror stat
    const mirrorStat =
      MIRROR_STATS[Math.floor(Math.random() * MIRROR_STATS.length)](todayBreakAttempts);

    set({
      isBreakFlowActive: true,
      step: 'pause',
      appId,
      appName,
      sessionId: sessionId ?? null,
      typedReason: '',
      mirrorStat,
      streakAtRisk: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 3 : null, // Simulate streak
      countdownRemaining: FRICTION_COUNTDOWN_SECONDS,
    });
  },

  setTypedReason: (reason: string) => {
    set({ typedReason: reason });
  },

  submitPause: () => {
    const { typedReason } = get();
    if (typedReason.trim().length < 3) return; // Require at least a few characters
    set({ step: 'mirror' });
  },

  submitMirror: () => {
    set({ step: 'countdown', countdownRemaining: get().countdownSeconds });
  },

  startCountdown: () => {
    set({ step: 'countdown', countdownRemaining: get().countdownSeconds });
  },

  tickCountdown: () => {
    const { countdownRemaining } = get();
    if (countdownRemaining <= 1) {
      // Countdown finished - complete the break
      get().completeBreak(false);
    } else {
      set({ countdownRemaining: countdownRemaining - 1 });
    }
  },

  cancelBreak: () => {
    // User cancelled during countdown - don't log as break
    set({
      isBreakFlowActive: false,
      step: null,
      appId: null,
      appName: null,
      sessionId: null,
      typedReason: '',
      mirrorStat: null,
      streakAtRisk: null,
      countdownRemaining: FRICTION_COUNTDOWN_SECONDS,
    });
  },

  completeBreak: (wasEmergency: boolean = false) => {
    const { appId, appName, sessionId, typedReason, todayBreakAttempts } = get();

    // Log the break attempt
    const breakAttempt: BreakAttempt = {
      id: 'local_' + Date.now(),
      userId: 'dev',
      sessionId,
      createdAt: new Date().toISOString(),
      appName: appName ?? 'Unknown',
      reason: typedReason,
      mood: null,
      completed: true,
      cancelledAt: null,
      wasEmergency,
    };

    set((state) => ({
      isBreakFlowActive: false,
      step: 'complete',
      todayBreakAttempts: todayBreakAttempts + 1,
      recentBreaks: [breakAttempt, ...state.recentBreaks.slice(0, 9)],
    }));

    // Reset after a delay
    setTimeout(() => {
      set({
        step: null,
        appId: null,
        appName: null,
        sessionId: null,
        typedReason: '',
        mirrorStat: null,
        streakAtRisk: null,
        countdownRemaining: FRICTION_COUNTDOWN_SECONDS,
      });
    }, 500);
  },

  closeBreakFlow: () => {
    set({
      isBreakFlowActive: false,
      step: null,
      appId: null,
      appName: null,
      sessionId: null,
      typedReason: '',
      mirrorStat: null,
      streakAtRisk: null,
      countdownRemaining: FRICTION_COUNTDOWN_SECONDS,
    });
  },

  loadBreakHistory: async () => {
    // TODO: Load from API
    set({ todayBreakAttempts: 0, recentBreaks: [] });
  },
}));
