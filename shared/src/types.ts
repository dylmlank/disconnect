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
