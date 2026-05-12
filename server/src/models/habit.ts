import { db } from '../config/database';
import { CURATED_HABITS, MAX_HABITS } from '@disconnect/shared';
import type { HabitDefinition, UserHabit, HabitLog, HabitStreak } from '@disconnect/shared';

function getDefinition(habitId: string): HabitDefinition | null {
  return (CURATED_HABITS as readonly HabitDefinition[]).find((h) => h.id === habitId) ?? null;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUserHabits(userId: string): Promise<{ habits: UserHabit[]; todayLogs: HabitLog[] }> {
  const rows = await db('user_habits')
    .where('user_id', userId)
    .orderBy('position', 'asc')
    .select('*');

  const today = todayDate();
  const logRows = await db('habit_logs')
    .where({ user_id: userId, logged_date: today })
    .select('*');

  const habits: UserHabit[] = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    habitId: row.habit_id as string,
    customName: row.custom_name as string | null,
    position: row.position as number,
    definition: getDefinition(row.habit_id as string),
  }));

  const todayLogs: HabitLog[] = logRows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    habitId: row.habit_id as string,
    loggedDate: typeof row.logged_date === 'string'
      ? row.logged_date
      : (row.logged_date as Date).toISOString().slice(0, 10),
    loggedAt: (row.logged_at as Date).toISOString(),
  }));

  return { habits, todayLogs };
}

export async function addHabit(
  userId: string,
  habitId: string,
  customName?: string,
): Promise<UserHabit> {
  const existing = await db('user_habits').where('user_id', userId).count('* as count').first();
  if (existing && Number(existing.count) >= MAX_HABITS) {
    throw Object.assign(new Error(`Maximum of ${MAX_HABITS} habits allowed`), { code: 'MAX_HABITS' });
  }

  const maxPos = await db('user_habits')
    .where('user_id', userId)
    .max('position as max')
    .first();
  const position = maxPos && maxPos.max != null ? Number(maxPos.max) + 1 : 0;

  const [row] = await db('user_habits')
    .insert({
      user_id: userId,
      habit_id: habitId,
      custom_name: customName ?? null,
      position,
    })
    .returning('*');

  return {
    id: row.id,
    habitId: row.habit_id,
    customName: row.custom_name,
    position: row.position,
    definition: getDefinition(row.habit_id),
  };
}

export async function removeHabit(userId: string, habitId: string): Promise<boolean> {
  const deleted = await db('user_habits').where({ user_id: userId, habit_id: habitId }).del();
  return deleted > 0;
}

export async function logHabit(userId: string, habitId: string): Promise<HabitLog> {
  const today = todayDate();

  // Idempotent — return existing if already logged
  const existing = await db('habit_logs')
    .where({ user_id: userId, habit_id: habitId, logged_date: today })
    .first();

  if (existing) {
    return {
      id: existing.id,
      habitId: existing.habit_id,
      loggedDate: typeof existing.logged_date === 'string'
        ? existing.logged_date
        : (existing.logged_date as Date).toISOString().slice(0, 10),
      loggedAt: (existing.logged_at as Date).toISOString(),
    };
  }

  const [row] = await db('habit_logs')
    .insert({ user_id: userId, habit_id: habitId, logged_date: today })
    .returning('*');

  return {
    id: row.id,
    habitId: row.habit_id,
    loggedDate: typeof row.logged_date === 'string'
      ? row.logged_date
      : (row.logged_date as Date).toISOString().slice(0, 10),
    loggedAt: (row.logged_at as Date).toISOString(),
  };
}

export async function unlogHabit(userId: string, habitId: string, date: string): Promise<boolean> {
  const deleted = await db('habit_logs')
    .where({ user_id: userId, habit_id: habitId, logged_date: date })
    .del();
  return deleted > 0;
}

export async function getStreaks(userId: string): Promise<HabitStreak[]> {
  const rows = await db('user_habits')
    .where('user_id', userId)
    .select('habit_id');

  const streaks: HabitStreak[] = [];

  for (const { habit_id } of rows) {
    // Get all logged dates for this habit, most recent first
    const logs = await db('habit_logs')
      .where({ user_id: userId, habit_id })
      .orderBy('logged_date', 'desc')
      .select('logged_date');

    const dates = logs.map((l: Record<string, unknown>) =>
      typeof l.logged_date === 'string'
        ? l.logged_date
        : (l.logged_date as Date).toISOString().slice(0, 10),
    );

    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const today = new Date(todayDate());

    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (dates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    // If today not yet logged, check if streak is still alive from yesterday
    if (currentStreak === 0 && dates.length > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (dates[0] === yesterdayStr) {
        // streak from yesterday; count backwards
        for (let i = 0; i < dates.length; i++) {
          const expected = new Date(yesterday);
          expected.setDate(yesterday.getDate() - i);
          const expectedStr = expected.toISOString().slice(0, 10);
          if (dates[i] === expectedStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let runStreak = 0;
    const sortedAsc = [...dates].sort();
    for (let i = 0; i < sortedAsc.length; i++) {
      if (i === 0) {
        runStreak = 1;
      } else {
        const prev = new Date(sortedAsc[i - 1]);
        const curr = new Date(sortedAsc[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          runStreak++;
        } else {
          runStreak = 1;
        }
      }
      if (runStreak > longestStreak) longestStreak = runStreak;
    }

    streaks.push({ habitId: habit_id, currentStreak, longestStreak });
  }

  return streaks;
}
