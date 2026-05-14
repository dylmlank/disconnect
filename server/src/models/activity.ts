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

export interface CircleActivityItem {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
}

export async function getCircleActivity(userId: string): Promise<CircleActivityItem[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get all user IDs in the same circles as this user
  const circleMembers = await db.raw(`
    SELECT DISTINCT cm2.user_id, u.first_name
    FROM circle_members cm1
    JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
    JOIN users u ON cm2.user_id = u.id
    WHERE cm1.user_id = $1 AND cm2.user_id != $1
  `, [userId]);

  if (circleMembers.rows.length === 0) return [];

  const memberIds = circleMembers.rows.map((r: any) => r.user_id);
  const memberNames: Record<string, string> = {};
  circleMembers.rows.forEach((r: any) => { memberNames[r.user_id] = r.first_name; });

  const blockedIds = await getBlockedUserIds(userId);
  const filteredIds = memberIds.filter((id: string) => !blockedIds.includes(id));
  if (filteredIds.length === 0) return [];

  const placeholders = filteredIds.map((_: string, i: number) => `$${i + 2}`).join(', ');

  // Recent habit logs by circle members
  const habitLogs = await db.raw(`
    SELECT
      hl.id::text as item_id,
      hl.user_id,
      h.habit_id,
      hl.logged_at as timestamp
    FROM habit_logs hl
    JOIN user_habits h ON hl.user_habit_id = h.id
    WHERE hl.user_id IN (${placeholders})
      AND hl.logged_at > $1
    ORDER BY hl.logged_at DESC
    LIMIT 5
  `, [since, ...filteredIds]);

  // Recent check-ins by circle members
  const checkIns = await db.raw(`
    SELECT
      c.id::text as item_id,
      c.user_id,
      c.mood,
      c.created_at as timestamp
    FROM check_ins c
    WHERE c.user_id IN (${placeholders})
      AND c.created_at > $1
    ORDER BY c.created_at DESC
    LIMIT 5
  `, [since, ...filteredIds]);

  // Recent focus completions
  const focusSessions = await db.raw(`
    SELECT
      fs.id::text as item_id,
      fs.user_id,
      fs.duration_minutes,
      fs.completed_at as timestamp
    FROM focus_sessions fs
    WHERE fs.user_id IN (${placeholders})
      AND fs.completed = true
      AND fs.completed_at > $1
    ORDER BY fs.completed_at DESC
    LIMIT 5
  `, [since, ...filteredIds]);

  const activities: CircleActivityItem[] = [];

  habitLogs.rows.forEach((r: any) => {
    activities.push({
      id: `habit-${r.item_id}`,
      userName: memberNames[r.user_id] || 'Someone',
      action: 'logged a habit',
      timestamp: new Date(r.timestamp).toISOString(),
    });
  });

  checkIns.rows.forEach((r: any) => {
    const moods: Record<number, string> = { 1: 'rough', 2: 'meh', 3: 'okay', 4: 'good', 5: 'amazing' };
    activities.push({
      id: `checkin-${r.item_id}`,
      userName: memberNames[r.user_id] || 'Someone',
      action: `checked in feeling ${moods[r.mood] || 'okay'}`,
      timestamp: new Date(r.timestamp).toISOString(),
    });
  });

  focusSessions.rows.forEach((r: any) => {
    activities.push({
      id: `focus-${r.item_id}`,
      userName: memberNames[r.user_id] || 'Someone',
      action: `completed a ${r.duration_minutes}min focus session`,
      timestamp: new Date(r.timestamp).toISOString(),
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, 5);
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
