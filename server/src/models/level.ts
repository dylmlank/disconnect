import { db } from '../config/database';
import { getXPProgress } from '@disconnect/shared';

export async function calculateUserXP(userId: string): Promise<number> {
  // Habit logs: 5 XP each
  const habitLogs = Number((await db('habit_logs').where('user_id', userId).count('* as c').first())?.c || 0);

  // Check-ins: 10 XP each
  const checkIns = Number((await db('check_ins').where('user_id', userId).count('* as c').first())?.c || 0);

  // Focus sessions completed: 15 XP each
  const focusSessions = Number((await db('focus_sessions').where({ user_id: userId, completed: true }).count('* as c').first())?.c || 0);

  // Events attended: 20 XP each
  const eventsAttended = Number((await db('event_rsvps').join('events', 'event_rsvps.event_id', 'events.id').where('event_rsvps.user_id', userId).where('events.starts_at', '<', new Date()).count('* as c').first())?.c || 0);

  // Challenges completed: 50 XP each
  const challengesCompleted = Number((await db('challenge_participants').where({ user_id: userId, completed: true }).count('* as c').first())?.c || 0);

  // Vibes: 2 XP each
  const vibes = Number((await db('vibes').where('user_id', userId).count('* as c').first())?.c || 0);

  return (habitLogs * 5) + (checkIns * 10) + (focusSessions * 15) + (eventsAttended * 20) + (challengesCompleted * 50) + (vibes * 2);
}

export async function getUserLevel(userId: string) {
  const xp = await calculateUserXP(userId);
  const progress = getXPProgress(xp);
  return { xp, ...progress };
}
