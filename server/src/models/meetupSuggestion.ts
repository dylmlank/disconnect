import { db } from '../config/database';

interface MeetupSuggestion {
  userId: string;
  firstName: string;
  photoUrl: string | null;
  reason: string;
  emoji: string;
  circleId: string;
  circleName: string;
  score: number;
}

/**
 * Generate smart meetup suggestions for a user.
 * Looks at:
 * - Circle members doing the same challenges
 * - People who focus at similar times
 * - Circle members with matching habits (could do together)
 * - Nearby circle members (via approximate_location)
 */
export async function getMeetupSuggestions(userId: string): Promise<MeetupSuggestion[]> {
  const suggestions: MeetupSuggestion[] = [];

  // Get user's circles
  const userCircles = await db('circle_members')
    .join('circles', 'circle_members.circle_id', 'circles.id')
    .where('circle_members.user_id', userId)
    .select('circles.id as circle_id', 'circles.name as circle_name');

  if (userCircles.length === 0) return [];

  const circleIds = userCircles.map((c: any) => c.circle_id);
  const circleMap = Object.fromEntries(userCircles.map((c: any) => [c.circle_id, c.circle_name]));

  // Get all circle members (excluding self)
  const circleMembers = await db('circle_members')
    .join('users', 'circle_members.user_id', 'users.id')
    .whereIn('circle_members.circle_id', circleIds)
    .where('circle_members.user_id', '!=', userId)
    .select(
      'circle_members.user_id',
      'circle_members.circle_id',
      'users.first_name',
      'users.photo_url',
    );

  // 1. Shared active challenges — "You're both doing X, do it together!"
  const myChallenges = await db('challenge_participants')
    .where('user_id', userId)
    .select('challenge_id');
  const myChallengeIds = myChallenges.map((c: any) => c.challenge_id);

  if (myChallengeIds.length > 0) {
    const sharedChallengers = await db('challenge_participants')
      .join('challenges', 'challenge_participants.challenge_id', 'challenges.id')
      .join('users', 'challenge_participants.user_id', 'users.id')
      .whereIn('challenge_participants.challenge_id', myChallengeIds)
      .where('challenge_participants.user_id', '!=', userId)
      .whereIn('challenge_participants.user_id', circleMembers.map((m: any) => m.user_id))
      .select(
        'challenge_participants.user_id',
        'users.first_name',
        'users.photo_url',
        'challenges.title as challenge_title',
        'challenges.category',
      )
      .limit(5);

    for (const sc of sharedChallengers) {
      const memberCircle = circleMembers.find((m: any) => m.user_id === sc.user_id);
      if (!memberCircle) continue;

      const emoji = sc.category === 'walk' ? '🚶' :
                    sc.category === 'deep_work' ? '📚' :
                    sc.category === 'gratitude' ? '☀️' :
                    sc.category === 'phone_free' ? '📵' : '🤝';

      suggestions.push({
        userId: sc.user_id,
        firstName: sc.first_name,
        photoUrl: sc.photo_url,
        reason: `Both doing "${sc.challenge_title}" — do it together IRL?`,
        emoji,
        circleId: memberCircle.circle_id,
        circleName: circleMap[memberCircle.circle_id] || '',
        score: 3,
      });
    }
  }

  // 2. Matching outdoor habits — "You both track nature time, go for a walk together"
  const myHabits = await db('user_habits')
    .where('user_id', userId)
    .select('habit_id');
  const myHabitIds = myHabits.map((h: any) => h.habit_id);

  const outdoorHabits = ['exercise', 'nature', 'cold_exposure'];
  const myOutdoor = myHabitIds.filter((h: string) => outdoorHabits.includes(h));

  if (myOutdoor.length > 0) {
    const matchingMembers = await db('user_habits')
      .join('users', 'user_habits.user_id', 'users.id')
      .whereIn('user_habits.habit_id', myOutdoor)
      .where('user_habits.user_id', '!=', userId)
      .whereIn('user_habits.user_id', circleMembers.map((m: any) => m.user_id))
      .select('user_habits.user_id', 'user_habits.habit_id', 'users.first_name', 'users.photo_url')
      .limit(5);

    for (const mm of matchingMembers) {
      // Skip if already suggested
      if (suggestions.some((s) => s.userId === mm.user_id)) continue;

      const memberCircle = circleMembers.find((m: any) => m.user_id === mm.user_id);
      if (!memberCircle) continue;

      const habitLabel = mm.habit_id === 'exercise' ? 'exercise' :
                         mm.habit_id === 'nature' ? 'nature time' : 'cold exposure';

      suggestions.push({
        userId: mm.user_id,
        firstName: mm.first_name,
        photoUrl: mm.photo_url,
        reason: `You both track ${habitLabel} — better together outdoors`,
        emoji: mm.habit_id === 'exercise' ? '🏃' : mm.habit_id === 'nature' ? '🌿' : '🧊',
        circleId: memberCircle.circle_id,
        circleName: circleMap[memberCircle.circle_id] || '',
        score: 2,
      });
    }
  }

  // 3. Focus buddies — people who completed focus sessions recently
  const recentFocusers = await db('focus_sessions')
    .join('users', 'focus_sessions.user_id', 'users.id')
    .where('focus_sessions.completed', true)
    .where('focus_sessions.started_at', '>', new Date(Date.now() - 48 * 60 * 60 * 1000))
    .where('focus_sessions.user_id', '!=', userId)
    .whereIn('focus_sessions.user_id', circleMembers.map((m: any) => m.user_id))
    .select('focus_sessions.user_id', 'users.first_name', 'users.photo_url', 'focus_sessions.intention')
    .orderBy('focus_sessions.started_at', 'desc')
    .limit(3);

  for (const rf of recentFocusers) {
    if (suggestions.some((s) => s.userId === rf.user_id)) continue;

    const memberCircle = circleMembers.find((m: any) => m.user_id === rf.user_id);
    if (!memberCircle) continue;

    suggestions.push({
      userId: rf.user_id,
      firstName: rf.first_name,
      photoUrl: rf.photo_url,
      reason: rf.intention
        ? `Recently focused on "${rf.intention}" — co-work session?`
        : 'Recently completed a focus session — study together?',
      emoji: '🎯',
      circleId: memberCircle.circle_id,
      circleName: circleMap[memberCircle.circle_id] || '',
      score: 1,
    });
  }

  // Sort by score (best suggestions first), dedupe by userId
  const seen = new Set<string>();
  const deduped = suggestions
    .sort((a, b) => b.score - a.score)
    .filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    });

  return deduped.slice(0, 5);
}
