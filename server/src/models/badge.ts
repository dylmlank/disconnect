import { db } from '../config/database';
import { BADGES } from '@disconnect/shared';
import type { BadgeDefinition } from '@disconnect/shared';

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  definition: BadgeDefinition;
}

export async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  const rows = await db('badges').where('user_id', userId).orderBy('earned_at', 'desc');
  return rows.map((r: any) => ({
    badgeId: r.badge_id,
    earnedAt: r.earned_at.toISOString(),
    definition: BADGES.find((b) => b.id === r.badge_id)!,
  })).filter((b: EarnedBadge) => b.definition);
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    await db('badges').insert({ user_id: userId, badge_id: badgeId }).onConflict(['user_id', 'badge_id']).ignore();
    return true;
  } catch {
    return false;
  }
}

// Check and award all applicable badges for a user
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const existing = new Set((await db('badges').where('user_id', userId).select('badge_id')).map((r: any) => r.badge_id));
  const awarded: string[] = [];

  // Events attended
  const eventsAttended = Number((await db('event_rsvps').join('events', 'event_rsvps.event_id', 'events.id').where('event_rsvps.user_id', userId).where('events.starts_at', '<', new Date()).count('* as c').first())?.c || 0);
  if (eventsAttended >= 1 && !existing.has('first_event')) { await awardBadge(userId, 'first_event'); awarded.push('first_event'); }
  if (eventsAttended >= 10 && !existing.has('event_regular')) { await awardBadge(userId, 'event_regular'); awarded.push('event_regular'); }

  // Events created
  const eventsCreated = Number((await db('events').where('creator_id', userId).count('* as c').first())?.c || 0);
  if (eventsCreated >= 1 && !existing.has('event_host')) { await awardBadge(userId, 'event_host'); awarded.push('event_host'); }

  // Habit streaks
  const habits = await db('user_habits').where('user_id', userId).select('habit_id');
  for (const h of habits) {
    const logs = await db('habit_logs').where({ user_id: userId, habit_id: h.habit_id }).orderBy('logged_date', 'desc').select('logged_date');
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let checkDate = today;
    for (const log of logs) {
      const logDate = typeof log.logged_date === 'string' ? log.logged_date : new Date(log.logged_date).toISOString().slice(0, 10);
      if (logDate === checkDate) {
        streak++;
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().slice(0, 10);
      } else {
        break;
      }
    }
    if (streak >= 7 && !existing.has('habit_week')) { await awardBadge(userId, 'habit_week'); awarded.push('habit_week'); }
    if (streak >= 30 && !existing.has('habit_month')) { await awardBadge(userId, 'habit_month'); awarded.push('habit_month'); }
  }

  // Five habits
  const habitCount = Number((await db('user_habits').where('user_id', userId).count('* as c').first())?.c || 0);
  if (habitCount >= 5 && !existing.has('five_habits')) { await awardBadge(userId, 'five_habits'); awarded.push('five_habits'); }

  // Focus sessions
  const focusSessions = Number((await db('focus_sessions').where({ user_id: userId, completed: true }).count('* as c').first())?.c || 0);
  if (focusSessions >= 1 && !existing.has('first_focus')) { await awardBadge(userId, 'first_focus'); awarded.push('first_focus'); }

  const totalFocusMin = Number((await db('focus_sessions').where({ user_id: userId, completed: true }).sum('duration_minutes as total').first())?.total || 0);
  if (totalFocusMin >= 600 && !existing.has('focus_10h')) { await awardBadge(userId, 'focus_10h'); awarded.push('focus_10h'); }
  if (totalFocusMin >= 6000 && !existing.has('focus_100h')) { await awardBadge(userId, 'focus_100h'); awarded.push('focus_100h'); }

  // Challenges
  const challengesCompleted = Number((await db('challenge_participants').where({ user_id: userId, completed: true }).count('* as c').first())?.c || 0);
  if (challengesCompleted >= 1 && !existing.has('first_challenge')) { await awardBadge(userId, 'first_challenge'); awarded.push('first_challenge'); }
  if (challengesCompleted >= 5 && !existing.has('five_challenges')) { await awardBadge(userId, 'five_challenges'); awarded.push('five_challenges'); }

  // Circles
  const circleCount = Number((await db('circle_members').where('user_id', userId).count('* as c').first())?.c || 0);
  if (circleCount >= 1 && !existing.has('first_circle')) { await awardBadge(userId, 'first_circle'); awarded.push('first_circle'); }

  // Beacons
  const beaconCount = Number((await db('beacons').where('creator_id', userId).count('* as c').first())?.c || 0);
  if (beaconCount >= 1 && !existing.has('first_beacon')) { await awardBadge(userId, 'first_beacon'); awarded.push('first_beacon'); }

  // Check-in streak
  const checkins = await db('check_ins').where('user_id', userId).orderBy('check_in_date', 'desc').select('check_in_date').limit(30);
  let checkinStreak = 0;
  let checkDay = new Date().toISOString().slice(0, 10);
  for (const ci of checkins) {
    const ciDate = typeof ci.check_in_date === 'string' ? ci.check_in_date : new Date(ci.check_in_date).toISOString().slice(0, 10);
    if (ciDate === checkDay) {
      checkinStreak++;
      const prev = new Date(checkDay);
      prev.setDate(prev.getDate() - 1);
      checkDay = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  if (checkinStreak >= 7 && !existing.has('checkin_streak')) { await awardBadge(userId, 'checkin_streak'); awarded.push('checkin_streak'); }

  return awarded;
}
