import { db } from '../config/database';

export interface EventSuggestion {
  challengeId: string;
  challengeTitle: string;
  participantCount: number;
  category: string;
  emoji: string;
  suggestedActivity: string;
}

const OUTDOOR_CATEGORIES = ['walk', 'phone_free', 'gratitude'];

const CATEGORY_EMOJI: Record<string, string> = {
  walk: '🚶',
  phone_free: '📵',
  gratitude: '☀️',
  deep_work: '📚',
  digital_sunset: '🌇',
  custom: '⭐',
};

const CATEGORY_ACTIVITY: Record<string, string> = {
  walk: 'Group walk',
  phone_free: 'Phone-free hangout',
  gratitude: 'Morning meetup',
  deep_work: 'Co-work session',
  digital_sunset: 'Sunset meetup',
  custom: 'Group meetup',
};

/**
 * Find active outdoor challenges nearby with 3+ participants.
 * Suggests creating group events around shared challenge activity.
 */
export async function getEventSuggestions(
  userId: string,
  lat: number,
  lng: number,
): Promise<EventSuggestion[]> {
  const radiusMeters = 25000; // 25km

  // Get user's current challenges
  const myParticipations = await db('challenge_participants')
    .where('user_id', userId)
    .select('challenge_id');
  const myIds = myParticipations.map((r: any) => r.challenge_id as string);

  // Find public outdoor challenges that are still active and have 3+ participants
  // Use PostGIS location on challenges table OR include ones the user participates in
  const rows = await db.raw(`
    SELECT c.id as challenge_id, c.title, c.category,
      (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id)::int as participant_count
    FROM challenges c
    WHERE c.is_public = true
      AND c.ends_at > CURRENT_DATE
      AND c.category IN (${OUTDOOR_CATEGORIES.map(() => '?').join(',')})
      AND (
        (c.location IS NOT NULL AND ST_DWithin(c.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?))
        OR c.id IN (${myIds.length > 0 ? myIds.map(() => '?').join(',') : "'00000000-0000-0000-0000-000000000000'"})
      )
    HAVING (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) >= 3
    ORDER BY participant_count DESC
    LIMIT 5
  `, [...OUTDOOR_CATEGORIES, lng, lat, radiusMeters, ...myIds]);

  const suggestions: EventSuggestion[] = (rows.rows || []).map((row: any) => ({
    challengeId: row.challenge_id,
    challengeTitle: row.title,
    participantCount: Number(row.participant_count),
    category: row.category,
    emoji: CATEGORY_EMOJI[row.category] ?? '⭐',
    suggestedActivity: CATEGORY_ACTIVITY[row.category] ?? 'Group meetup',
  }));

  return suggestions;
}
