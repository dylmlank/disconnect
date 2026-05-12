import { db } from '../config/database';
import { getBlockedUserIds } from './block';

export interface ActivityItem {
  id: string;
  type: 'new_event' | 'rsvp' | 'beacon_interest';
  message: string;
  timestamp: string;
  eventId?: string;
  beaconId?: string;
}

export async function getRecentActivity(options: {
  lat: number;
  lng: number;
  radiusMeters: number;
  userId: string;
}): Promise<ActivityItem[]> {
  const { lat, lng, radiusMeters, userId } = options;
  const blockedIds = await getBlockedUserIds(userId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  const blockFilter = blockedIds.length > 0
    ? `AND u.id NOT IN (${blockedIds.map((_, i) => `$${i + 5}`).join(', ')})`
    : '';
  const blockParams = blockedIds.length > 0 ? blockedIds : [];

  // Recent new events
  const newEvents = await db.raw(`
    SELECT
      e.id as item_id,
      'new_event' as type,
      u.first_name || ' created "' || e.title || '"' as message,
      e.created_at as timestamp,
      e.id as event_id,
      NULL as beacon_id
    FROM events e
    JOIN users u ON e.creator_id = u.id
    WHERE ST_DWithin(e.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND e.created_at > $4
      AND e.creator_id != $5
      ${blockedIds.length > 0 ? `AND e.creator_id NOT IN (${blockedIds.map(() => '?').join(', ')})` : ''}
    ORDER BY e.created_at DESC
    LIMIT 5
  `.replace(/\?/g, () => `$${6 + blockParams.indexOf(blockParams[0])}`),
    [lng, lat, radiusMeters, since, userId]);

  // Recent RSVPs
  const rsvps = await db.raw(`
    SELECT
      er.event_id || '_' || er.user_id as item_id,
      'rsvp' as type,
      u.first_name || ' is going to "' || e.title || '"' as message,
      er.joined_at as timestamp,
      er.event_id as event_id,
      NULL as beacon_id
    FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    JOIN users u ON er.user_id = u.id
    WHERE ST_DWithin(e.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND er.joined_at > $4
      AND er.user_id != $5
    ORDER BY er.joined_at DESC
    LIMIT 5
  `, [lng, lat, radiusMeters, since, userId]);

  // Recent beacon interests
  const beaconActivity = await db.raw(`
    SELECT
      b.id || '_interests' as item_id,
      'beacon_interest' as type,
      (SELECT COUNT(*) FROM beacon_interests WHERE beacon_id = b.id)::text || ' people interested in ' || u.first_name || '''s beacon' as message,
      b.created_at as timestamp,
      NULL as event_id,
      b.id as beacon_id
    FROM beacons b
    JOIN users u ON b.creator_id = u.id
    WHERE ST_DWithin(b.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND b.created_at > $4
      AND b.expires_at > NOW()
      AND b.creator_id != $5
      AND EXISTS(SELECT 1 FROM beacon_interests WHERE beacon_id = b.id)
    ORDER BY b.created_at DESC
    LIMIT 5
  `, [lng, lat, radiusMeters, since, userId]);

  // Merge and sort all activity by timestamp, limit to 15
  const allActivity: ActivityItem[] = [
    ...newEvents.rows.map((r: any) => ({
      id: r.item_id,
      type: r.type as ActivityItem['type'],
      message: r.message,
      timestamp: new Date(r.timestamp).toISOString(),
      eventId: r.event_id || undefined,
      beaconId: r.beacon_id || undefined,
    })),
    ...rsvps.rows.map((r: any) => ({
      id: r.item_id,
      type: r.type as ActivityItem['type'],
      message: r.message,
      timestamp: new Date(r.timestamp).toISOString(),
      eventId: r.event_id || undefined,
      beaconId: r.beacon_id || undefined,
    })),
    ...beaconActivity.rows.map((r: any) => ({
      id: r.item_id,
      type: r.type as ActivityItem['type'],
      message: r.message,
      timestamp: new Date(r.timestamp).toISOString(),
      eventId: r.event_id || undefined,
      beaconId: r.beacon_id || undefined,
    })),
  ];

  allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return allActivity.slice(0, 15);
}
