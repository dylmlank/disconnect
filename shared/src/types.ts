export interface User {
  id: string;
  firstName: string;
  dateOfBirth: string;
  bio: string | null;
  interests: string[];
  photoUrl: string | null;
  isMinor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  bio: string | null;
  interests: string[];
  photoUrl: string | null;
  isMinor: boolean;
}

export interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  location: GeoPoint;
  address: string | null;
  startsAt: string;
  endsAt: string | null;
  category: EventCategory;
  maxAttendees: number;
  allAges: boolean;
  createdAt: string;
}

export interface EventWithDistance extends Event {
  distance: number;
  attendeeCount: number;
  creator: UserProfile;
  hasRsvp: boolean;
}

export interface EventDetail extends EventWithDistance {
  attendees: UserProfile[];
  chatUnlocked: boolean;
}

export interface EventRSVP {
  eventId: string;
  userId: string;
  joinedAt: string;
}

export interface Beacon {
  id: string;
  creatorId: string;
  message: string;
  activity: string | null;
  location: GeoPoint;
  placeName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface BeaconWithCreator extends Beacon {
  creator: UserProfile;
  interestCount: number;
  hasExpressedInterest: boolean;
}

export interface BeaconInterest {
  beaconId: string;
  userId: string;
  expressedAt: string;
}

export interface BeaconInterestDetail {
  user: UserProfile;
  expressedAt: string;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  message: string;
  sentAt: string;
  sender: UserProfile;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ScreenTimeEntry {
  date: string;
  totalSeconds: number;
}

export interface ScreenTimeSummary {
  weeklyMinutes: number;
  dailyBreakdown: ScreenTimeEntry[];
}

export type EventCategory =
  | 'outdoors'
  | 'coffee'
  | 'sports'
  | 'games'
  | 'study'
  | 'creative'
  | 'food'
  | 'music'
  | 'volunteering';

// ─── Circles ────────────────────────────────────────────────

export interface Circle {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
}

export interface CircleMember {
  userId: string;
  firstName: string;
  photoUrl: string | null;
  joinedAt: string;
}

export interface CircleDetail extends Circle {
  members: CircleMember[];
}

export interface CircleFeedItem {
  id: string;
  type: 'habit_log' | 'check_in' | 'challenge_log' | 'focus_session';
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  message: string;
  timestamp: string;
  targetId: string;
  reactions: ReactionSummary[];
}

// ─── Challenges ─────────────────────────────────────────────

export type ChallengeCategory =
  | 'phone_free'
  | 'walk'
  | 'deep_work'
  | 'digital_sunset'
  | 'gratitude'
  | 'custom';

export interface Challenge {
  id: string;
  creatorId: string;
  circleId: string | null;
  title: string;
  description: string | null;
  durationDays: number;
  dailyRequirement: string;
  category: ChallengeCategory;
  researchNote: string | null;
  startsAt: string;
  endsAt: string;
  isPublic: boolean;
  participantCount: number;
  createdAt: string;
}

export interface ChallengeDetail extends Challenge {
  participants: ChallengeParticipantProgress[];
  myProgress: ChallengeDayLog[];
  isJoined: boolean;
}

export interface ChallengeParticipantProgress {
  userId: string;
  firstName: string;
  photoUrl: string | null;
  completedDays: number;
  totalDays: number;
}

export interface ChallengeDayLog {
  dayNumber: number;
  completed: boolean;
  photoUrl: string | null;
  loggedAt: string | null;
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  dailyRequirement: string;
  category: ChallengeCategory;
  researchNote: string;
}

// ─── Focus Sessions ─────────────────────────────────────────

export interface FocusSession {
  id: string;
  userId: string;
  userName?: string;
  userPhotoUrl?: string | null;
  intention: string | null;
  durationMinutes: number;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
  circleId: string | null;
}

// ─── Habits ─────────────────────────────────────────────────

export interface HabitDefinition {
  id: string;
  name: string;
  description: string;
  researchNote: string;
  citation: string;
  emoji: string;
  targetMinutes?: number;
}

export interface UserHabit {
  id: string;
  habitId: string;
  customName: string | null;
  position: number;
  definition: HabitDefinition | null; // null for custom habits
}

export interface HabitLog {
  id: string;
  habitId: string;
  loggedDate: string;
  loggedAt: string;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
}

// ─── Check-ins ──────────────────────────────────────────────

export interface CheckIn {
  id: string;
  userId: string;
  mood: 1 | 2 | 3 | 4 | 5;
  goodThing1: string;
  goodThing2: string;
  goodThing3: string;
  intention: string | null;
  checkInDate: string;
  createdAt: string;
}

// ─── Reactions ──────────────────────────────────────────────

export type ReactionTargetType = 'habit_log' | 'check_in' | 'challenge_log' | 'focus_session';

export interface Reaction {
  id: string;
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userReacted: boolean;
}
