import { db } from '../config/database';

// Calculate a circle's group streak — consecutive days where ALL members logged at least 1 habit
export async function getCircleGroupStreak(circleId: string): Promise<number> {
  const memberRows = await db('circle_members').where('circle_id', circleId).select('user_id');
  const memberIds = memberRows.map((m: any) => m.user_id);

  if (memberIds.length === 0) return 0;

  // For each day going back, check if ALL members logged at least 1 habit
  let streak = 0;
  const today = new Date();

  for (let daysBack = 0; daysBack < 60; daysBack++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - daysBack);
    const dateStr = checkDate.toISOString().slice(0, 10);

    // Count how many members logged on this day
    const logsResult = await db('habit_logs')
      .whereIn('user_id', memberIds)
      .where('logged_date', dateStr)
      .countDistinct('user_id as active_members')
      .first();

    const activeMembers = Number(logsResult?.active_members || 0);

    if (activeMembers === memberIds.length) {
      streak++;
    } else {
      // Allow first day (today) to be incomplete since it's still in progress
      if (daysBack === 0) continue;
      break;
    }
  }

  return streak;
}

// Get suggested friends based on shared activity
export async function getSuggestedFriends(userId: string, limit: number = 5) {
  // Find people who attend the same events, are in overlapping circles, or share habits
  const suggestions = await db.raw(`
    WITH shared_events AS (
      SELECT er2.user_id, COUNT(*) as shared_count
      FROM event_rsvps er1
      JOIN event_rsvps er2 ON er1.event_id = er2.event_id AND er2.user_id != er1.user_id
      WHERE er1.user_id = ?
      GROUP BY er2.user_id
    ),
    shared_circles AS (
      SELECT cm2.user_id, COUNT(*) as shared_count
      FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id AND cm2.user_id != cm1.user_id
      WHERE cm1.user_id = ?
      GROUP BY cm2.user_id
    )
    SELECT DISTINCT u.id, u.first_name, u.bio, u.interests, u.photo_url,
      COALESCE(se.shared_count, 0) + COALESCE(sc.shared_count, 0) as score
    FROM users u
    LEFT JOIN shared_events se ON u.id = se.user_id
    LEFT JOIN shared_circles sc ON u.id = sc.user_id
    WHERE u.id != ?
      AND u.is_minor = false
      AND (se.shared_count > 0 OR sc.shared_count > 0)
      AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
      AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
    ORDER BY score DESC
    LIMIT ?
  `, [userId, userId, userId, userId, userId, limit]);

  return suggestions.rows.map((r: any) => ({
    id: r.id,
    firstName: r.first_name,
    bio: r.bio,
    interests: r.interests,
    photoUrl: r.photo_url,
    score: r.score,
  }));
}
