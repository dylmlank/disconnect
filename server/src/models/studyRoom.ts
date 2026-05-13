import { db } from '../config/database';

export interface StudyRoom {
  id: string;
  creatorId: string;
  name: string;
  vibe: string;
  roomType: 'study' | 'walk_talk';
  isPublic: boolean;
  circleId: string | null;
  activeCount: number;
  totalHours: number;
  createdAt: string;
}

export const ROOM_VIBES = [
  { id: 'lofi', label: 'Lo-fi Chill', emoji: '🎵' },
  { id: 'deep_work', label: 'Deep Work', emoji: '🧠' },
  { id: 'morning', label: 'Morning Grind', emoji: '☀️' },
  { id: 'library', label: 'Library Mode', emoji: '📚' },
  { id: 'night_owl', label: 'Night Owl', emoji: '🦉' },
];

export const WALK_VIBES = [
  { id: 'hot_girl_walk', label: 'Hot Girl Walk', emoji: '💅' },
  { id: 'nature_walk', label: 'Nature Walk', emoji: '🌿' },
  { id: 'podcast_walk', label: 'Podcast Walk', emoji: '🎧' },
];

export const ALL_VIBES = [...ROOM_VIBES, ...WALK_VIBES];

export async function createRoom(data: {
  creatorId: string;
  name: string;
  vibe: string;
  isPublic: boolean;
  roomType?: 'study' | 'walk_talk';
  circleId?: string;
  lat?: number;
  lng?: number;
}): Promise<StudyRoom> {
  const insert: Record<string, unknown> = {
    creator_id: data.creatorId,
    name: data.name,
    vibe: data.vibe,
    is_public: data.isPublic,
    circle_id: data.circleId || null,
    room_type: data.roomType ?? 'study',
  };

  if (data.lat && data.lng) {
    insert.location = db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [data.lng, data.lat]);
  }

  const [row] = await db('study_rooms').insert(insert).returning('*');
  return toRoom(row);
}

export async function getPublicRooms(lat?: number, lng?: number, roomType?: 'study' | 'walk_talk'): Promise<StudyRoom[]> {
  let query = db('study_rooms').where('is_public', true).orderBy('active_count', 'desc').limit(20);

  if (roomType) {
    query = query.where('room_type', roomType);
  }

  if (lat && lng) {
    const radiusMeters = 25 * 1609.34; // 25 miles
    query = query.whereRaw(
      `ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
      [lng, lat, radiusMeters],
    );
  }

  const rows = await query;
  return rows.map(toRoom);
}

export async function joinRoom(roomId: string): Promise<void> {
  await db('study_rooms').where('id', roomId).increment('active_count', 1);
}

export async function leaveRoom(roomId: string, minutesSpent: number): Promise<void> {
  await db('study_rooms').where('id', roomId).decrement('active_count', 1);
  const hoursToAdd = Math.floor(minutesSpent / 60);
  if (hoursToAdd > 0) {
    await db('study_rooms').where('id', roomId).increment('total_hours', hoursToAdd);
  }
}

export async function getRoomById(roomId: string): Promise<StudyRoom | null> {
  const row = await db('study_rooms').where('id', roomId).first();
  return row ? toRoom(row) : null;
}

function toRoom(row: any): StudyRoom {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    vibe: row.vibe,
    roomType: (row.room_type as 'study' | 'walk_talk') ?? 'study',
    isPublic: row.is_public,
    circleId: row.circle_id,
    activeCount: row.active_count,
    totalHours: row.total_hours,
    createdAt: row.created_at.toISOString(),
  };
}

