import { db } from '../config/database';
import type { FocusSession } from '@disconnect/shared';

function mapRow(row: Record<string, unknown>): FocusSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: row.user_name as string | undefined,
    userPhotoUrl: row.user_photo_url as string | null | undefined,
    intention: row.intention as string | null,
    durationMinutes: row.duration_minutes as number,
    startedAt: (row.started_at as Date).toISOString(),
    endedAt: row.ended_at ? (row.ended_at as Date).toISOString() : null,
    completed: row.completed as boolean,
    circleId: row.circle_id as string | null,
  };
}

export async function startSession(
  userId: string,
  durationMinutes: number,
  intention?: string,
  circleId?: string,
): Promise<FocusSession> {
  const [row] = await db('focus_sessions')
    .insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      intention: intention ?? null,
      circle_id: circleId ?? null,
    })
    .returning('*');

  return mapRow(row);
}

export async function completeSession(sessionId: string, userId: string): Promise<FocusSession | null> {
  const [row] = await db('focus_sessions')
    .where({ id: sessionId, user_id: userId })
    .whereNull('ended_at')
    .update({ ended_at: db.fn.now(), completed: true })
    .returning('*');

  return row ? mapRow(row) : null;
}

export async function cancelSession(sessionId: string, userId: string): Promise<FocusSession | null> {
  const [row] = await db('focus_sessions')
    .where({ id: sessionId, user_id: userId })
    .whereNull('ended_at')
    .update({ ended_at: db.fn.now(), completed: false })
    .returning('*');

  return row ? mapRow(row) : null;
}

export async function getActiveSessions(circleId?: string): Promise<FocusSession[]> {
  let query = db('focus_sessions as fs')
    .join('users as u', 'u.id', 'fs.user_id')
    .whereNull('fs.ended_at')
    .select(
      'fs.*',
      'u.first_name as user_name',
      'u.photo_url as user_photo_url',
    );

  if (circleId) {
    query = query.where('fs.circle_id', circleId);
  }

  const rows = await query;
  return rows.map((row: Record<string, unknown>) => mapRow(row));
}

export async function getSessionHistory(userId: string, limit: number): Promise<FocusSession[]> {
  const rows = await db('focus_sessions')
    .where({ user_id: userId, completed: true })
    .orderBy('started_at', 'desc')
    .limit(limit)
    .select('*');

  return rows.map((row: Record<string, unknown>) => mapRow(row));
}

export async function getWeeklyFocusMinutes(userId: string): Promise<number> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const result = await db('focus_sessions')
    .where({ user_id: userId, completed: true })
    .where('started_at', '>=', startOfWeek.toISOString())
    .sum('duration_minutes as total')
    .first();

  return result && result.total ? Number(result.total) : 0;
}
