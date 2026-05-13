export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: string;
}

export const BADGES: readonly BadgeDefinition[] = [
  // Events
  { id: 'first_event', name: 'First Steps', description: 'Attended your first event', emoji: '🎉', requirement: 'Attend 1 event' },
  { id: 'event_regular', name: 'Regular', description: 'Attended 10 events', emoji: '📅', requirement: 'Attend 10 events' },
  { id: 'event_host', name: 'Host', description: 'Created your first event', emoji: '🎤', requirement: 'Create 1 event' },

  // Habits
  { id: 'habit_week', name: 'Week Warrior', description: '7-day habit streak', emoji: '🔥', requirement: '7-day streak on any habit' },
  { id: 'habit_month', name: 'Month Strong', description: '30-day habit streak', emoji: '💪', requirement: '30-day streak on any habit' },
  { id: 'five_habits', name: 'Full Roster', description: 'Tracking 5 habits', emoji: '🌟', requirement: 'Track 5 habits simultaneously' },

  // Focus
  { id: 'first_focus', name: 'Focused', description: 'Completed your first focus session', emoji: '🎯', requirement: 'Complete 1 focus session' },
  { id: 'focus_10h', name: 'Deep Worker', description: '10 hours of total focus time', emoji: '🧠', requirement: 'Accumulate 10 hours of focus' },
  { id: 'focus_100h', name: 'Centurion', description: '100 hours of total focus time', emoji: '⚡', requirement: 'Accumulate 100 hours of focus' },

  // Challenges
  { id: 'first_challenge', name: 'Challenger', description: 'Completed your first challenge', emoji: '🏆', requirement: 'Complete 1 challenge' },
  { id: 'five_challenges', name: 'Champion', description: 'Completed 5 challenges', emoji: '👑', requirement: 'Complete 5 challenges' },

  // Social
  { id: 'first_circle', name: 'Connected', description: 'Joined your first circle', emoji: '👥', requirement: 'Join 1 circle' },
  { id: 'first_beacon', name: 'Beacon Dropper', description: 'Dropped your first beacon', emoji: '📍', requirement: 'Drop 1 beacon' },
  { id: 'checkin_streak', name: 'Reflective', description: '7 consecutive daily check-ins', emoji: '📝', requirement: '7-day check-in streak' },

  // Screen time
  { id: 'minimal_user', name: 'Minimalist', description: 'Under 15 minutes of weekly screen time', emoji: '🌿', requirement: 'Weekly screen time < 15 min' },
] as const;

export const BADGE_IDS: readonly string[] = BADGES.map((b) => b.id);
