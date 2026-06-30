// ─── Disconnect v3 Types ─────────────────────────────────────
// Core types for the v3 "Mirror" concept

// ─── Goals & Interests ────────────────────────────────────────

export type GoalType = 'read' | 'exercise' | 'create' | 'learn' | 'connect' | 'outside' | 'other';

export interface UserGoal {
  type: GoalType;
  customLabel?: string; // for 'other' type
  priority: number; // 1 = top priority
}

// ─── Trigger Apps ─────────────────────────────────────────────

export interface TriggerApp {
  id: string;
  userId: string;
  appName: string; // "Instagram", "TikTok", etc.
  packageName?: string; // Android: com.instagram.android
  bundleId?: string; // iOS: com.burbn.instagram
  isBlockingEnabled: boolean;
  createdAt: string;
}

// ─── Sessions ─────────────────────────────────────────────────

export type SessionStatus = 'active' | 'completed' | 'ended_early';

export interface Session {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  moodBefore: number | null; // 1-5
  moodAfter: number | null; // 1-5
  note: string | null; // "Read 2 chapters"
  status: SessionStatus;
}

export interface SessionWithStats extends Session {
  breakAttemptCount: number;
  streakAfter: number; // streak value after this session
}

// ─── Break Attempts ───────────────────────────────────────────

export interface BreakAttempt {
  id: string;
  userId: string;
  sessionId: string | null; // null if impulse gate triggered outside session
  createdAt: string;
  appName: string;
  reason: string; // what they typed in the pause
  mood: ImpulseTrigger | null;
  completed: boolean; // did they go through with the break?
  cancelledAt: string | null;
  wasEmergency: boolean; // used kill switch
}

// ─── Impulse Tracking ─────────────────────────────────────────

export type ImpulseTrigger =
  | 'bored'
  | 'anxious'
  | 'lonely'
  | 'tired'
  | 'procrastinating'
  | 'habit'
  | 'other';

export interface ImpulseLog {
  id: string;
  userId: string;
  createdAt: string;
  appName: string;
  trigger: ImpulseTrigger;
  moodBefore: number | null; // 1-5
  moodAfter: number | null; // 1-5
  durationSeconds: number | null; // how long they scrolled
}

// ─── Check-ins ────────────────────────────────────────────────

export type MoodCheckInType = 'session_start' | 'session_end' | 'post_scroll' | 'daily';

export interface MoodCheckIn {
  id: string;
  userId: string;
  createdAt: string;
  type: MoodCheckInType;
  mood: number; // 1-5
  energy: number; // 1-5
  focus: number; // 1-5
  note: string | null;
}

// ─── Streaks ──────────────────────────────────────────────────

export interface Streak {
  userId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastSessionDate: string | null;
  updatedAt: string;
}

// ─── User Stats (Aggregated) ──────────────────────────────────

export interface UserStats {
  userId: string;

  // Time tracking
  totalOfflineHours: number;
  sessionsCompleted: number;
  totalBreakAttempts: number;
  avgSessionDurationMinutes: number;

  // Patterns
  mostCommonTrigger: ImpulseTrigger | null;
  mostDistractedHour: number | null; // 0-23
  avgMoodAfterScroll: number | null;
  avgMoodAfterSession: number | null;

  // Streaks
  currentStreak: number;
  longestStreak: number;
}

// ─── Inventory (Time Loss Calculations) ───────────────────────

export interface TimeInventory {
  // Current period
  hoursThisWeek: number;
  hoursThisMonth: number;
  hoursThisYear: number;

  // Lifetime projection
  estimatedYearsByAge30: number | null; // null if over 30
  estimatedYearsByAge40: number | null;

  // Opportunity cost
  goalHoursMissed: {
    goal: GoalType;
    hoursThatCouldHaveBeenSpent: number;
    label: string;
  }[];
}

// ─── Patterns & Insights ──────────────────────────────────────

export interface ImpulsePattern {
  hour: number; // 0-23
  count: number;
  topTrigger: ImpulseTrigger;
  avgMoodAfter: number;
}

export interface WeeklyPattern {
  day: string; // "Monday", etc.
  totalBreakAttempts: number;
  totalSessionMinutes: number;
  avgMood: number;
}

export interface InsightMessage {
  type: 'info' | 'warning' | 'confrontation' | 'existential';
  message: string;
  basedOn: string; // what data this is based on
  createdAt: string;
}

// ─── Alternative Suggestions ──────────────────────────────────

export type SuggestionType = 'quick_win' | 'goal_aligned' | 'hobby_discovery' | 'progress_reminder';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  durationMinutes: number | null;
  relatedGoal?: GoalType;
  emoji?: string;
}

// ─── Friction Settings ────────────────────────────────────────

export type FrictionLevel = 'gentle' | 'moderate' | 'firm';

export interface FrictionSettings {
  // Which steps are enabled
  pauseEnabled: boolean;
  mirrorEnabled: boolean;
  countdownEnabled: boolean;
  costEnabled: boolean;

  // Timing
  countdownSeconds: number;

  // Level preset (affects all above)
  level: FrictionLevel;
}

// ─── User Preferences (v3) ────────────────────────────────────

export interface UserPreferences {
  goals: UserGoal[];
  estimatedDailyScreenTime: number; // hours
  frictionSettings: FrictionSettings;
  defaultSessionDuration: number; // minutes
  notificationsEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

// ─── API Response Types ───────────────────────────────────────

export interface SessionStartResponse {
  session: Session;
  suggestions: Suggestion[];
}

export interface BreakFlowState {
  step: 'pause' | 'mirror' | 'countdown' | 'complete';
  sessionId: string;
  appName: string;
  typedReason?: string;
  mirrorStat?: string;
  streakAtRisk?: number;
}
