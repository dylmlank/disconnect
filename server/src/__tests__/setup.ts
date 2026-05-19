import 'dotenv/config';
import { db } from '../config/database';

export async function cleanDb() {
  // Platform expansion tables
  await db('nudges').del().catch(() => {});
  await db('reactions').del().catch(() => {});
  await db('challenge_logs').del().catch(() => {});
  await db('challenge_participants').del().catch(() => {});
  await db('challenges').del().catch(() => {});
  await db('habit_logs').del().catch(() => {});
  await db('user_habits').del().catch(() => {});
  await db('check_ins').del().catch(() => {});
  await db('focus_sessions').del().catch(() => {});
  await db('circle_messages').del().catch(() => {});
  await db('circle_members').del().catch(() => {});
  await db('circles').del().catch(() => {});
  // MVP tables
  await db('beacon_interests').del();
  await db('event_rsvps').del();
  await db('event_chat_messages').del();
  await db('blocks').del();
  await db('beacons').del();
  await db('events').del();
  await db('users').del();
}

export async function createTestUser(overrides: Partial<{
  phone: string;
  firstName: string;
  dateOfBirth: string;
  bio: string;
  interests: string[];
  isMinor: boolean;
}> = {}) {
  const dob = overrides.dateOfBirth || '2000-01-01';
  const isMinor = overrides.isMinor ?? false;

  const [user] = await db('users')
    .insert({
      clerk_id: `test_clerk_${Math.random().toString(36).slice(2, 10)}`,
      first_name: overrides.firstName || 'TestUser',
      date_of_birth: dob,
      bio: overrides.bio || 'Test bio',
      interests: overrides.interests || ['hiking', 'coffee'],
      is_minor: isMinor,
    })
    .returning('*');

  // In test mode, the authenticate middleware accepts a Postgres UUID as Bearer token
  const token = user.id;

  return { user, token };
}

export async function createTestEvent(creatorId: string, overrides: Record<string, unknown> = {}) {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [event] = await db('events')
    .insert({
      creator_id: creatorId,
      title: overrides.title || 'Test Event',
      description: overrides.description || 'A test event',
      location: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7431, 30.2672]),
      address: overrides.address || '123 Test St, Austin TX',
      starts_at: overrides.starts_at || startsAt,
      category: overrides.category || 'outdoors',
      max_attendees: overrides.max_attendees || 10,
      all_ages: overrides.all_ages ?? true,
    })
    .returning('*');

  return event;
}

export async function createTestBeacon(creatorId: string, overrides: Record<string, unknown> = {}) {
  const [beacon] = await db('beacons')
    .insert({
      creator_id: creatorId,
      message: overrides.message || 'Test beacon',
      activity: overrides.activity || null,
      location: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7431, 30.2672]),
      place_name: overrides.place_name || null,
      expires_at: overrides.expires_at || new Date(Date.now() + 2 * 60 * 60 * 1000),
    })
    .returning('*');

  return beacon;
}

export async function createTestCircle(creatorId: string, name = 'Test Circle') {
  const inviteCode = Math.random().toString(36).slice(2, 10);

  const [circle] = await db('circles')
    .insert({
      name,
      creator_id: creatorId,
      invite_code: inviteCode,
    })
    .returning('*');

  await db('circle_members').insert({ circle_id: circle.id, user_id: creatorId });

  return { circle, inviteCode };
}

export { db };
