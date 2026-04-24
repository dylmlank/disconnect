import { db } from '../config/database';
import { getBlockedUserIds } from './block';
import { toUserProfile } from './user';

export async function findBeaconsNearby(options: {
  lat: number;
  lng: number;
  radiusMeters: number;
  userId: string;
}) {
  const { lat, lng, radiusMeters, userId } = options;
  const blockedIds = await getBlockedUserIds(userId);

  let query = db('beacons')
    .select(
      'beacons.*',
      db.raw(`ST_Y(beacons.location::geometry) as lat`),
      db.raw(`ST_X(beacons.location::geometry) as lng`),
      db.raw(
        `(SELECT COUNT(*) FROM beacon_interests WHERE beacon_interests.beacon_id = beacons.id)::int as interest_count`,
      ),
      db.raw(
        `EXISTS(SELECT 1 FROM beacon_interests WHERE beacon_interests.beacon_id = beacons.id AND beacon_interests.user_id = ?) as has_expressed_interest`,
        [userId],
      ),
    )
    .join('users as creator', 'beacons.creator_id', 'creator.id')
    .select(
      'creator.id as creator_id',
      'creator.first_name as creator_first_name',
      'creator.bio as creator_bio',
      'creator.interests as creator_interests',
      'creator.photo_url as creator_photo_url',
      'creator.is_minor as creator_is_minor',
    )
    .whereRaw(
      `ST_DWithin(beacons.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
      [lng, lat, radiusMeters],
    )
    .where('beacons.expires_at', '>', new Date());

  if (blockedIds.length > 0) {
    query = query.whereNotIn('beacons.creator_id', blockedIds);
  }

  const rows = await query.orderBy('beacons.created_at', 'desc').limit(50);

  return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      creatorId: row.creator_id as string,
      message: row.message as string,
      activity: row.activity as string | null,
      location: { latitude: row.lat as number, longitude: row.lng as number },
      placeName: row.place_name as string | null,
      expiresAt: (row.expires_at as Date).toISOString(),
      createdAt: (row.created_at as Date).toISOString(),
      creator: {
        id: row.creator_id as string,
        firstName: row.creator_first_name as string,
        bio: row.creator_bio as string | null,
        interests: row.creator_interests as string[],
        photoUrl: row.creator_photo_url as string | null,
        isMinor: row.creator_is_minor as boolean,
      },
      interestCount: row.interest_count as number,
      hasExpressedInterest: row.has_expressed_interest as boolean,
  }));
}

export async function createBeacon(data: {
  creatorId: string;
  message: string;
  activity?: string;
  lat: number;
  lng: number;
  placeName?: string;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  const [row] = await db('beacons')
    .insert({
      creator_id: data.creatorId,
      message: data.message,
      activity: data.activity || null,
      location: db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [data.lng, data.lat]),
      place_name: data.placeName || null,
      expires_at: expiresAt,
    })
    .returning('id');

  return row.id;
}

export async function getActiveBeaconCount(userId: string): Promise<number> {
  const result = await db('beacons')
    .where('creator_id', userId)
    .where('expires_at', '>', new Date())
    .count('* as count')
    .first();

  return Number(result?.count || 0);
}

export async function addBeaconInterest(beaconId: string, userId: string): Promise<boolean> {
  const beacon = await db('beacons').where('id', beaconId).where('expires_at', '>', new Date()).first();
  if (!beacon) return false;

  await db('beacon_interests')
    .insert({ beacon_id: beaconId, user_id: userId })
    .onConflict(['beacon_id', 'user_id'])
    .ignore();

  return true;
}

export async function getBeaconInterests(beaconId: string) {
  const rows = await db('beacon_interests')
    .join('users', 'beacon_interests.user_id', 'users.id')
    .where('beacon_interests.beacon_id', beaconId)
    .select('users.*', 'beacon_interests.expressed_at')
    .orderBy('beacon_interests.expressed_at', 'desc');

  return {
    interests: rows.map((row) => ({
      user: toUserProfile(row),
      expressedAt: row.expressed_at.toISOString(),
    })),
    count: rows.length,
  };
}

export async function deleteBeacon(beaconId: string, userId: string): Promise<boolean> {
  const deleted = await db('beacons').where({ id: beaconId, creator_id: userId }).del();
  return deleted > 0;
}

export async function expireOldBeacons(): Promise<number> {
  return db('beacons').where('expires_at', '<', new Date()).del();
}
