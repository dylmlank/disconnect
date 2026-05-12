import { db } from '../config/database';
import type { CheckIn } from '@disconnect/shared';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapRow(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mood: row.mood as 1 | 2 | 3 | 4 | 5,
    goodThing1: row.good_thing_1 as string,
    goodThing2: row.good_thing_2 as string,
    goodThing3: row.good_thing_3 as string,
    intention: row.intention as string | null,
    checkInDate: typeof row.check_in_date === 'string'
      ? row.check_in_date
      : (row.check_in_date as Date).toISOString().slice(0, 10),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function createCheckIn(
  userId: string,
  data: {
    mood: number;
    goodThing1: string;
    goodThing2: string;
    goodThing3: string;
    intention?: string;
  },
): Promise<CheckIn> {
  const today = todayDate();

  const existing = await db('check_ins').where({ user_id: userId, check_in_date: today }).first();
  if (existing) {
    throw Object.assign(new Error('Already checked in today'), { code: 'ALREADY_CHECKED_IN' });
  }

  const [row] = await db('check_ins')
    .insert({
      user_id: userId,
      mood: data.mood,
      good_thing_1: data.goodThing1,
      good_thing_2: data.goodThing2,
      good_thing_3: data.goodThing3,
      intention: data.intention ?? null,
      check_in_date: today,
    })
    .returning('*');

  return mapRow(row);
}

export async function getTodayCheckIn(userId: string): Promise<CheckIn | null> {
  const today = todayDate();
  const row = await db('check_ins').where({ user_id: userId, check_in_date: today }).first();
  return row ? mapRow(row) : null;
}

export async function getCheckInHistory(userId: string, limit = 30): Promise<CheckIn[]> {
  const rows = await db('check_ins')
    .where('user_id', userId)
    .orderBy('check_in_date', 'desc')
    .limit(limit)
    .select('*');
  return rows.map(mapRow);
}
