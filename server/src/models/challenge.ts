import { db } from '../config/database';
import { getBlockedUserIds } from './block';
import { CHALLENGE_TEMPLATES } from '@disconnect/shared';
import type { Challenge, ChallengeDetail, ChallengeTemplate } from '@disconnect/shared';

function mapChallenge(row: Record<string, unknown>): Challenge {
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    circleId: row.circle_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    durationDays: row.duration_days as number,
    dailyRequirement: row.daily_requirement as string,
    category: row.category as Challenge['category'],
    researchNote: row.research_note as string | null,
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString().slice(0, 10) : String(row.starts_at),
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString().slice(0, 10) : String(row.ends_at),
    isPublic: row.is_public as boolean,
    participantCount: Number(row.participant_count ?? 0),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getPublicChallenges(
  lat: number,
  lng: number,
  radiusMeters: number,
  userId: string,
): Promise<Challenge[]> {
  const blockedIds = await getBlockedUserIds(userId);
  const now = new Date();

  let query = db('challenges')
    .select(
      'challenges.*',
      db.raw(
        `(SELECT COUNT(*) FROM challenge_participants WHERE challenge_participants.challenge_id = challenges.id)::int as participant_count`,
      ),
    )
    .where('challenges.is_public', true)
    .where('challenges.ends_at', '>=', now)
    .whereNotNull('challenges.location');

  // Radius filter using PostGIS
  query = query.whereRaw(
    `ST_DWithin(challenges.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
    [lng, lat, radiusMeters],
  );

  if (blockedIds.length > 0) {
    query = query.whereNotIn('challenges.creator_id', blockedIds);
  }

  const rows = await query.orderBy('challenges.starts_at', 'asc').limit(50);
  return rows.map(mapChallenge);
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const rows = await db('challenges')
    .join('challenge_participants as cp', 'challenges.id', 'cp.challenge_id')
    .select(
      'challenges.*',
      db.raw(
        `(SELECT COUNT(*) FROM challenge_participants WHERE challenge_participants.challenge_id = challenges.id)::int as participant_count`,
      ),
    )
    .where('cp.user_id', userId)
    .orderBy('challenges.starts_at', 'desc');

  return rows.map(mapChallenge);
}

export async function getChallengeDetail(
  challengeId: string,
  userId: string,
): Promise<ChallengeDetail | null> {
  const row = await db('challenges')
    .select(
      'challenges.*',
      db.raw(
        `(SELECT COUNT(*) FROM challenge_participants WHERE challenge_participants.challenge_id = challenges.id)::int as participant_count`,
      ),
      db.raw(
        `EXISTS(SELECT 1 FROM challenge_participants WHERE challenge_participants.challenge_id = challenges.id AND challenge_participants.user_id = ?) as is_joined`,
        [userId],
      ),
    )
    .where('challenges.id', challengeId)
    .first();

  if (!row) return null;

  const challenge = mapChallenge(row);

  // Get participants with their progress
  const participantRows = await db('challenge_participants as cp')
    .join('users', 'cp.user_id', 'users.id')
    .select(
      'users.id as user_id',
      'users.first_name',
      'users.photo_url',
      db.raw(
        `(SELECT COUNT(*) FROM challenge_logs cl WHERE cl.challenge_id = ? AND cl.user_id = cp.user_id AND cl.completed = true)::int as completed_days`,
        [challengeId],
      ),
    )
    .where('cp.challenge_id', challengeId);

  const participants = participantRows.map((p: Record<string, unknown>) => ({
    userId: p.user_id as string,
    firstName: p.first_name as string,
    photoUrl: p.photo_url as string | null,
    completedDays: Number(p.completed_days),
    totalDays: challenge.durationDays,
  }));

  // Get user's own day logs
  const myLogRows = await db('challenge_logs')
    .where({ challenge_id: challengeId, user_id: userId })
    .orderBy('day_number', 'asc')
    .select('*');

  // Build full day log array (all days 1..durationDays)
  const logMap = new Map<number, { completed: boolean; photoUrl: string | null; loggedAt: string }>();
  for (const lr of myLogRows) {
    logMap.set(lr.day_number, {
      completed: lr.completed as boolean,
      photoUrl: lr.photo_url as string | null,
      loggedAt: (lr.logged_at as Date).toISOString(),
    });
  }

  const myProgress = Array.from({ length: challenge.durationDays }, (_, i) => {
    const day = i + 1;
    const log = logMap.get(day);
    return {
      dayNumber: day,
      completed: log?.completed ?? false,
      photoUrl: log?.photoUrl ?? null,
      loggedAt: log?.loggedAt ?? null,
    };
  });

  return {
    ...challenge,
    participants,
    myProgress,
    isJoined: row.is_joined as boolean,
  };
}

export async function createChallenge(data: {
  creatorId: string;
  circleId?: string | null;
  title: string;
  description?: string | null;
  durationDays: number;
  dailyRequirement: string;
  category: string;
  researchNote?: string | null;
  startsAt: string;
  isPublic: boolean;
  lat?: number | null;
  lng?: number | null;
}): Promise<string> {
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + data.durationDays - 1);

  const insertData: Record<string, unknown> = {
    creator_id: data.creatorId,
    circle_id: data.circleId ?? null,
    title: data.title,
    description: data.description ?? null,
    duration_days: data.durationDays,
    daily_requirement: data.dailyRequirement,
    category: data.category,
    research_note: data.researchNote ?? null,
    starts_at: data.startsAt,
    ends_at: endsAt.toISOString().slice(0, 10),
    is_public: data.isPublic,
  };

  if (data.isPublic && data.lat != null && data.lng != null) {
    insertData.location = db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [data.lng, data.lat]);
  }

  const [row] = await db('challenges').insert(insertData).returning('id');
  const challengeId = row.id as string;

  // Creator auto-joins
  await db('challenge_participants').insert({ challenge_id: challengeId, user_id: data.creatorId });

  return challengeId;
}

export async function joinChallenge(challengeId: string, userId: string): Promise<boolean> {
  const challenge = await db('challenges').where('id', challengeId).first();
  if (!challenge) return false;

  await db('challenge_participants')
    .insert({ challenge_id: challengeId, user_id: userId })
    .onConflict(['challenge_id', 'user_id'])
    .ignore();

  return true;
}

export async function logDay(
  challengeId: string,
  userId: string,
  dayNumber: number,
  completed: boolean,
  photoUrl?: string | null,
): Promise<void> {
  await db('challenge_logs')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      day_number: dayNumber,
      completed,
      photo_url: photoUrl ?? null,
    })
    .onConflict(['challenge_id', 'user_id', 'day_number'])
    .merge({ completed, photo_url: photoUrl ?? null });
}

export function getTemplates(): readonly ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES;
}
