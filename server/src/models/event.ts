import { db } from '../config/database';
import { getBlockedUserIds } from './block';
import { toUserProfile } from './user';

// Maps user interests to relevant event categories
const INTEREST_TO_CATEGORY: Record<string, string[]> = {
  hiking: ['outdoors'],
  running: ['outdoors', 'sports'],
  cycling: ['outdoors', 'sports'],
  yoga: ['sports'],
  climbing: ['outdoors', 'sports'],
  swimming: ['sports'],
  basketball: ['sports'],
  soccer: ['sports'],
  tennis: ['sports'],
  skateboarding: ['sports', 'outdoors'],
  surfing: ['sports', 'outdoors'],
  photography: ['creative', 'outdoors'],
  painting: ['creative'],
  music: ['music', 'creative'],
  reading: ['study', 'coffee'],
  writing: ['creative', 'study'],
  cooking: ['food'],
  gardening: ['outdoors', 'volunteering'],
  'board-games': ['games'],
  'video-games': ['games'],
  film: ['creative'],
  volunteering: ['volunteering'],
  meditation: ['outdoors'],
  camping: ['outdoors'],
  coffee: ['coffee'],
  dogs: ['outdoors'],
  fitness: ['sports'],
  dancing: ['music'],
  'language-learning': ['study'],
  travel: ['outdoors', 'food'],
};

export interface EventRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location: string;
  address: string | null;
  starts_at: Date;
  ends_at: Date | null;
  category: string;
  max_attendees: number;
  all_ages: boolean;
  created_at: Date;
}

export async function findEventsNearby(options: {
  lat: number;
  lng: number;
  radiusMeters: number;
  userId: string;
  isMinor: boolean;
  category?: string;
  search?: string;
}) {
  const { lat, lng, radiusMeters, userId, isMinor, category, search } = options;
  const blockedIds = await getBlockedUserIds(userId);

  let query = db('events')
    .select(
      'events.*',
      db.raw(`ST_Y(events.location::geometry) as lat`),
      db.raw(`ST_X(events.location::geometry) as lng`),
      db.raw(
        `ST_Distance(events.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance`,
        [lng, lat],
      ),
      db.raw(`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = events.id)::int as attendee_count`),
      db.raw(
        `EXISTS(SELECT 1 FROM event_rsvps WHERE event_rsvps.event_id = events.id AND event_rsvps.user_id = ?) as has_rsvp`,
        [userId],
      ),
    )
    .join('users as creator', 'events.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .whereRaw(`ST_DWithin(events.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`, [
      lng,
      lat,
      radiusMeters,
    ])
    .where('events.starts_at', '>', new Date());

  if (isMinor) {
    query = query.where('events.all_ages', true);
  }

  if (category) {
    query = query.where('events.category', category);
  }

  if (search) {
    query = query.where(function () {
      this.whereILike('events.title', `%${search}%`)
        .orWhereILike('events.description', `%${search}%`);
    });
  }

  if (blockedIds.length > 0) {
    query = query.whereNotIn('events.creator_id', blockedIds);
  }

  const rows = await query.orderBy('events.starts_at', 'asc').orderBy('distance', 'asc').limit(50);

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    creatorId: row.creator_id as string,
    title: row.title as string,
    description: row.description as string | null,
    location: { latitude: row.lat as number, longitude: row.lng as number },
    address: row.address as string | null,
    startsAt: (row.starts_at as Date).toISOString(),
    endsAt: row.ends_at ? (row.ends_at as Date).toISOString() : null,
    category: row.category as string,
    maxAttendees: row.max_attendees as number,
    allAges: row.all_ages as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    distance: Math.round(row.distance as number),
    attendeeCount: row.attendee_count as number,
    hasRsvp: row.has_rsvp as boolean,
    creator: {
      id: row.creator_id as string,
      firstName: row.creator_first_name as string,
      bio: row.creator_bio as string | null,
      interests: row.creator_interests as string[],
      photoUrl: row.creator_photo_url as string | null,
      isMinor: row.creator_is_minor as boolean,
    },
  }));
}

export async function findEventById(eventId: string, userId: string) {
  const row = await db('events')
    .select(
      'events.*',
      db.raw(`ST_Y(events.location::geometry) as lat`),
      db.raw(`ST_X(events.location::geometry) as lng`),
      db.raw(`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = events.id)::int as attendee_count`),
      db.raw(
        `EXISTS(SELECT 1 FROM event_rsvps WHERE event_rsvps.event_id = events.id AND event_rsvps.user_id = ?) as has_rsvp`,
        [userId],
      ),
    )
    .join('users as creator', 'events.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .where('events.id', eventId)
    .first();

  if (!row) return null;

  const attendeeRows = await db('event_rsvps')
    .join('users', 'event_rsvps.user_id', 'users.id')
    .where('event_rsvps.event_id', eventId)
    .select('users.*');

  const eventEnded = row.ends_at
    ? new Date(row.ends_at).getTime() + 24 * 60 * 60 * 1000 < Date.now()
    : row.starts_at && new Date(row.starts_at).getTime() + 24 * 60 * 60 * 1000 < Date.now();

  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    location: { latitude: row.lat, longitude: row.lng },
    address: row.address,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at ? row.ends_at.toISOString() : null,
    category: row.category,
    maxAttendees: row.max_attendees,
    allAges: row.all_ages,
    createdAt: row.created_at.toISOString(),
    distance: 0,
    attendeeCount: row.attendee_count,
    hasRsvp: row.has_rsvp,
    creator: {
      id: row.creator_id,
      firstName: row.creator_first_name,
      bio: row.creator_bio,
      interests: row.creator_interests,
      photoUrl: row.creator_photo_url,
      isMinor: row.creator_is_minor,
    },
    attendees: attendeeRows.map(toUserProfile),
    chatUnlocked: row.has_rsvp && !eventEnded,
  };
}

export async function createEvent(data: {
  creatorId: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  startsAt: string;
  endsAt?: string;
  category: string;
  maxAttendees?: number;
  allAges: boolean;
}): Promise<string> {
  const [row] = await db('events')
    .insert({
      creator_id: data.creatorId,
      title: data.title,
      description: data.description || null,
      location: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [data.lng, data.lat]),
      address: data.address || null,
      starts_at: data.startsAt,
      ends_at: data.endsAt || null,
      category: data.category,
      max_attendees: data.maxAttendees || 20,
      all_ages: data.allAges,
    })
    .returning('id');

  return row.id;
}

export async function addRsvp(eventId: string, userId: string): Promise<boolean> {
  const event = await db('events').where('id', eventId).first();
  if (!event) return false;

  const count = await db('event_rsvps').where('event_id', eventId).count('* as count').first();
  if (count && Number(count.count) >= event.max_attendees) return false;

  await db('event_rsvps').insert({ event_id: eventId, user_id: userId }).onConflict(['event_id', 'user_id']).ignore();
  return true;
}

export async function removeRsvp(eventId: string, userId: string): Promise<void> {
  await db('event_rsvps').where({ event_id: eventId, user_id: userId }).del();
}

export async function hasRsvp(eventId: string, userId: string): Promise<boolean> {
  const row = await db('event_rsvps').where({ event_id: eventId, user_id: userId }).first();
  return !!row;
}

export async function deleteEvent(eventId: string, userId: string): Promise<boolean> {
  const deleted = await db('events').where({ id: eventId, creator_id: userId }).del();
  return deleted > 0;
}

export async function findMyEvents(userId: string) {
  // Events the user created
  const hostingRows = await db('events')
    .select(
      'events.*',
      db.raw(`ST_Y(events.location::geometry) as lat`),
      db.raw(`ST_X(events.location::geometry) as lng`),
      db.raw(`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = events.id)::int as attendee_count`),
      db.raw(`true as has_rsvp`), // creator always RSVP'd
    )
    .join('users as creator', 'events.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .where('events.creator_id', userId)
    .orderBy('events.starts_at', 'asc');

  // Events the user RSVP'd to (but didn't create)
  const attendingRows = await db('events')
    .select(
      'events.*',
      db.raw(`ST_Y(events.location::geometry) as lat`),
      db.raw(`ST_X(events.location::geometry) as lng`),
      db.raw(`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = events.id)::int as attendee_count`),
      db.raw(`true as has_rsvp`),
    )
    .join('event_rsvps', 'events.id', 'event_rsvps.event_id')
    .join('users as creator', 'events.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .where('event_rsvps.user_id', userId)
    .whereNot('events.creator_id', userId)
    .orderBy('events.starts_at', 'asc');

  const mapRow = (row: Record<string, unknown>) => ({
    id: row.id as string,
    creatorId: row.creator_id as string,
    title: row.title as string,
    description: row.description as string | null,
    location: { latitude: row.lat as number, longitude: row.lng as number },
    address: row.address as string | null,
    startsAt: (row.starts_at as Date).toISOString(),
    endsAt: row.ends_at ? (row.ends_at as Date).toISOString() : null,
    category: row.category as string,
    maxAttendees: row.max_attendees as number,
    allAges: row.all_ages as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    distance: 0,
    attendeeCount: row.attendee_count as number,
    hasRsvp: true,
    creator: {
      id: row.creator_id as string,
      firstName: row.creator_first_name as string,
      bio: row.creator_bio as string | null,
      interests: row.creator_interests as string[],
      photoUrl: row.creator_photo_url as string | null,
      isMinor: row.creator_is_minor as boolean,
    },
  });

  return {
    hosting: hostingRows.map(mapRow),
    attending: attendingRows.map(mapRow),
  };
}

export function getSuggestedCategories(interests: string[]): string[] {
  const categories = new Set<string>();
  for (const interest of interests) {
    const mapped = INTEREST_TO_CATEGORY[interest];
    if (mapped) {
      mapped.forEach((c) => categories.add(c));
    }
  }
  return Array.from(categories);
}

export async function findSuggestedEvents(options: {
  lat: number;
  lng: number;
  radiusMeters: number;
  userId: string;
  isMinor: boolean;
  interests: string[];
}) {
  const { lat, lng, radiusMeters, userId, isMinor, interests } = options;
  const categories = getSuggestedCategories(interests);
  if (categories.length === 0) return [];

  const blockedIds = await getBlockedUserIds(userId);

  let query = db('events')
    .select(
      'events.*',
      db.raw(`ST_Y(events.location::geometry) as lat`),
      db.raw(`ST_X(events.location::geometry) as lng`),
      db.raw(
        `ST_Distance(events.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance`,
        [lng, lat],
      ),
      db.raw(`(SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.event_id = events.id)::int as attendee_count`),
      db.raw(
        `EXISTS(SELECT 1 FROM event_rsvps WHERE event_rsvps.event_id = events.id AND event_rsvps.user_id = ?) as has_rsvp`,
        [userId],
      ),
    )
    .join('users as creator', 'events.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .whereRaw(`ST_DWithin(events.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`, [
      lng, lat, radiusMeters,
    ])
    .where('events.starts_at', '>', new Date())
    .whereIn('events.category', categories);

  if (isMinor) {
    query = query.where('events.all_ages', true);
  }

  if (blockedIds.length > 0) {
    query = query.whereNotIn('events.creator_id', blockedIds);
  }

  const rows = await query.orderBy('events.starts_at', 'asc').limit(10);

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    creatorId: row.creator_id as string,
    title: row.title as string,
    description: row.description as string | null,
    location: { latitude: row.lat as number, longitude: row.lng as number },
    address: row.address as string | null,
    startsAt: (row.starts_at as Date).toISOString(),
    endsAt: row.ends_at ? (row.ends_at as Date).toISOString() : null,
    category: row.category as string,
    maxAttendees: row.max_attendees as number,
    allAges: row.all_ages as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    distance: Math.round(row.distance as number),
    attendeeCount: row.attendee_count as number,
    hasRsvp: row.has_rsvp as boolean,
    creator: {
      id: row.creator_id as string,
      firstName: row.creator_first_name as string,
      bio: row.creator_bio as string | null,
      interests: row.creator_interests as string[],
      photoUrl: row.creator_photo_url as string | null,
      isMinor: row.creator_is_minor as boolean,
    },
  }));
}

