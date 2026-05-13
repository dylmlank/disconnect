import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';

const router = Router();

// GET /api/recap/weekly — compute this week's stats for the current user
router.get('/weekly', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Habits completed this week (total logs)
  const habitLogs = await db('habit_logs')
    .where('user_id', userId)
    .where('logged_at', '>=', weekAgo)
    .count('* as count')
    .first();

  // Unique habit days (how many days had at least 1 habit logged)
  const habitDays = await db('habit_logs')
    .where('user_id', userId)
    .where('logged_at', '>=', weekAgo)
    .countDistinct('logged_date as count')
    .first();

  // Focus minutes
  const focusResult = await db('focus_sessions')
    .where({ user_id: userId, completed: true })
    .where('started_at', '>=', weekAgo)
    .sum('duration_minutes as total')
    .first();

  // Focus sessions count
  const focusSessions = await db('focus_sessions')
    .where({ user_id: userId, completed: true })
    .where('started_at', '>=', weekAgo)
    .count('* as count')
    .first();

  // Events attended
  const eventsAttended = await db('event_rsvps')
    .join('events', 'event_rsvps.event_id', 'events.id')
    .where('event_rsvps.user_id', userId)
    .where('events.starts_at', '>=', weekAgo)
    .where('events.starts_at', '<', now)
    .count('* as count')
    .first();

  // Challenges active
  const activeChallenges = await db('challenge_participants')
    .join('challenges', 'challenge_participants.challenge_id', 'challenges.id')
    .where('challenge_participants.user_id', userId)
    .where('challenges.ends_at', '>=', now.toISOString().slice(0, 10))
    .count('* as count')
    .first();

  // Check-ins this week
  const checkIns = await db('check_ins')
    .where('user_id', userId)
    .where('created_at', '>=', weekAgo)
    .select('mood', 'check_in_date')
    .orderBy('check_in_date', 'asc');

  // Vibes this week
  const vibes = await db('vibes')
    .where('user_id', userId)
    .where('vibe_date', '>=', weekAgo.toISOString().slice(0, 10))
    .select('vibe', 'vibe_date')
    .orderBy('vibe_date', 'asc');

  // Longest habit streak (current)
  const habits = await db('user_habits').where('user_id', userId).select('habit_id');
  let longestStreak = 0;
  for (const h of habits) {
    const logs = await db('habit_logs')
      .where({ user_id: userId, habit_id: h.habit_id })
      .orderBy('logged_date', 'desc')
      .select('logged_date')
      .limit(60);
    let streak = 0;
    let checkDate = now.toISOString().slice(0, 10);
    for (const log of logs) {
      const logDate = typeof log.logged_date === 'string' ? log.logged_date : new Date(log.logged_date).toISOString().slice(0, 10);
      if (logDate === checkDate) {
        streak++;
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().slice(0, 10);
      } else break;
    }
    if (streak > longestStreak) longestStreak = streak;
  }

  // User name
  const user = await db('users').where('id', userId).select('first_name').first();

  res.json({
    recap: {
      name: user?.first_name || '',
      weekStarting: weekAgo.toISOString().slice(0, 10),
      habitsLogged: Number(habitLogs?.count || 0),
      habitDays: Number(habitDays?.count || 0),
      focusMinutes: Number(focusResult?.total || 0),
      focusSessions: Number(focusSessions?.count || 0),
      eventsAttended: Number(eventsAttended?.count || 0),
      activeChallenges: Number(activeChallenges?.count || 0),
      checkIns: checkIns.map((c: any) => ({ mood: c.mood, date: c.check_in_date })),
      vibes: vibes.map((v: any) => ({ vibe: v.vibe, date: v.vibe_date })),
      longestStreak,
    },
  });
});

export default router;
