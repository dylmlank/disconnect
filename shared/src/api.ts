import {
  User,
  EventCategory,
  EventWithDistance,
  EventDetail,
  BeaconWithCreator,
  BeaconInterestDetail,
  ChatMessage,
  UserProfile,
  GeoPoint,
  ScreenTimeSummary,
} from './types';

// --- Auth ---

export interface SendCodeRequest {
  phone: string;
}

export interface SendCodeResponse {
  success: boolean;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface VerifyCodeResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface CreateProfileRequest {
  firstName: string;
  dateOfBirth: string;
  bio?: string;
  interests: string[];
}

export interface CreateProfileResponse {
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// --- Events ---

export interface ListEventsQuery {
  lat: number;
  lng: number;
  radius?: number;
  category?: EventCategory;
}

export interface ListEventsResponse {
  events: EventWithDistance[];
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location: GeoPoint;
  address?: string;
  startsAt: string;
  endsAt?: string;
  category: EventCategory;
  maxAttendees?: number;
  allAges: boolean;
}

export interface GetEventResponse {
  event: EventDetail;
}

export interface RsvpResponse {
  success: boolean;
}

export interface ListChatMessagesQuery {
  before?: string;
  limit?: number;
}

export interface ListChatMessagesResponse {
  messages: ChatMessage[];
}

// --- Beacons ---

export interface ListBeaconsQuery {
  lat: number;
  lng: number;
  radius?: number;
}

export interface ListBeaconsResponse {
  beacons: BeaconWithCreator[];
}

export interface CreateBeaconRequest {
  message: string;
  activity?: string;
  location: GeoPoint;
  placeName?: string;
}

export interface BeaconInterestResponse {
  success: boolean;
}

export interface GetBeaconInterestsResponse {
  interests: BeaconInterestDetail[];
  count: number;
}

// --- Users ---

export interface UpdateProfileRequest {
  firstName?: string;
  bio?: string;
  interests?: string[];
}

export interface GetProfileResponse {
  user: User;
}

export interface UploadPhotoResponse {
  photoUrl: string;
}

export interface GetScreenTimeResponse {
  screenTime: ScreenTimeSummary;
}

// --- Blocks ---

export interface BlockUserRequest {
  userId: string;
}

export interface BlockResponse {
  success: boolean;
}

export interface ListBlocksResponse {
  blockedUsers: UserProfile[];
}

// --- WebSocket Messages ---

export interface WsChatMessage {
  type: 'message';
  eventId: string;
  text: string;
}

export interface WsChatBroadcast {
  type: 'message';
  message: ChatMessage;
}

export type WsClientMessage = WsChatMessage;
export type WsServerMessage = WsChatBroadcast;
