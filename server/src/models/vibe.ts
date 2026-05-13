import { db } from '../config/database';

export type VibeType = 'thriving' | 'locked_in' | 'meh' | 'low_energy' | 'struggling';

export const VIBE_OPTIONS: { id: VibeType; label: string; emoji: string; color: string }[] = [
  { id: 'thriving', label: 'thriving', emoji: '🌊', color: '#4ade80' },
  { id: 'locked_in', label: 'locked in', emoji: '🎯', color: '#60a5fa' },
  { id: 'meh', label: 'meh', emoji: '😶', color: '#888888' },
  { id: 'low_energy', label: 'low energy', emoji: '🌧️', color: '#a78bfa' },
  { id: 'struggling', label: 'struggling', emoji: '🥀', color: '#f87171' },
];

export async function setVibe(userId: string, vibe: VibeType) {
  const today = new Date().toISOString().slice(0, 10);

  await db('vibes')
    .insert({ user_id: userId, vibe, vibe_date: today })
    .onConflict(['user_id', 'vibe_date'])
    .merge({ vibe, created_at: db.fn.now() });

  return { vibe, date: today };
}

export async function getTodayVibe(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const row = await db('vibes').where({ user_id: userId, vibe_date: today }).first();
  if (!row) return null;
  return { vibe: row.vibe as VibeType, date: row.vibe_date };
}

export async function getCircleVibes(circleId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db('vibes')
    .join('circle_members', 'vibes.user_id', 'circle_members.user_id')
    .join('users', 'vibes.user_id', 'users.id')
    .where('circle_members.circle_id', circleId)
    .where('vibes.vibe_date', today)
    .select('vibes.user_id', 'users.first_name', 'users.photo_url', 'vibes.vibe');

  return rows.map((r: any) => ({
    userId: r.user_id,
    firstName: r.first_name,
    photoUrl: r.photo_url,
    vibe: r.vibe as VibeType,
  }));
}

export async function getVibeHistory(userId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db('vibes')
    .where('user_id', userId)
    .where('vibe_date', '>=', since.toISOString().slice(0, 10))
    .orderBy('vibe_date', 'asc')
    .select('vibe', 'vibe_date');

  return rows.map((r: any) => ({
    vibe: r.vibe as VibeType,
    date: typeof r.vibe_date === 'string' ? r.vibe_date : new Date(r.vibe_date).toISOString().slice(0, 10),
  }));
}
