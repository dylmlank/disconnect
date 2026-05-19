import { db } from '../config/database';
import { sendPushToUser } from '../services/push';

const NUDGE_COOLDOWN_HOURS = 4; // Can only nudge same person once per 4 hours
const MAX_NUDGES_PER_DAY = 10; // Max nudges a user can send per day

export interface Nudge {
  id: string;
  fromUserId: string;
  toUserId: string;
  circleId: string;
  message: string;
  createdAt: string;
}

const NUDGE_MESSAGES = [
  "Hey! Haven't seen you today 👋",
  "Your circle misses you! Check in?",
  "Quick nudge — log your habits! 💪",
  "Time for your daily check-in?",
  "Focus session together? 🎯",
];

export function getRandomNudgeMessage(): string {
  return NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
}

export async function sendNudge(
  fromUserId: string,
  toUserId: string,
  circleId: string,
  customMessage?: string,
): Promise<{ error?: string; message?: string; nudge?: Nudge }> {
  // Verify both are in the same circle
  const fromMember = await db('circle_members')
    .where({ circle_id: circleId, user_id: fromUserId })
    .first();
  const toMember = await db('circle_members')
    .where({ circle_id: circleId, user_id: toUserId })
    .first();

  if (!fromMember || !toMember) {
    return { error: 'not_in_circle', message: 'Both users must be in the same circle' };
  }

  // Can't nudge yourself
  if (fromUserId === toUserId) {
    return { error: 'self_nudge', message: "You can't nudge yourself" };
  }

  // Check cooldown — can only nudge same person once per NUDGE_COOLDOWN_HOURS
  const cooldownTime = new Date(Date.now() - NUDGE_COOLDOWN_HOURS * 60 * 60 * 1000);
  const recentNudge = await db('nudges')
    .where({ from_user_id: fromUserId, to_user_id: toUserId })
    .where('created_at', '>', cooldownTime)
    .first();

  if (recentNudge) {
    return { error: 'cooldown', message: `You can nudge this person again in a few hours` };
  }

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await db('nudges')
    .where('from_user_id', fromUserId)
    .where('created_at', '>=', today)
    .count('* as count')
    .first();

  if (todayCount && Number(todayCount.count) >= MAX_NUDGES_PER_DAY) {
    return { error: 'daily_limit', message: "You've reached your daily nudge limit" };
  }

  const msg = customMessage || getRandomNudgeMessage();

  const [row] = await db('nudges')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      circle_id: circleId,
      message: msg,
    })
    .returning('*');

  // Send push notification
  const sender = await db('users').where('id', fromUserId).select('first_name').first();
  await sendPushToUser(toUserId, {
    title: `${sender?.first_name || 'Someone'} nudged you`,
    body: msg,
    data: { type: 'nudge', circleId, fromUserId },
  });

  return {
    nudge: {
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      circleId: row.circle_id,
      message: row.message,
      createdAt: row.created_at.toISOString(),
    },
  };
}

export async function getNudgesForUser(userId: string, limit = 20): Promise<any[]> {
  const rows = await db('nudges')
    .join('users', 'nudges.from_user_id', 'users.id')
    .where('nudges.to_user_id', userId)
    .orderBy('nudges.created_at', 'desc')
    .limit(limit)
    .select(
      'nudges.id',
      'nudges.from_user_id',
      'nudges.to_user_id',
      'nudges.circle_id',
      'nudges.message',
      'nudges.created_at',
      'users.first_name as from_name',
      'users.photo_url as from_photo',
    );

  return rows.map((r: any) => ({
    id: r.id,
    fromUserId: r.from_user_id,
    fromName: r.from_name,
    fromPhoto: r.from_photo,
    toUserId: r.to_user_id,
    circleId: r.circle_id,
    message: r.message,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function getCircleMembersActivity(circleId: string): Promise<any[]> {
  const today = new Date().toISOString().slice(0, 10);

  const members = await db('circle_members')
    .join('users', 'circle_members.user_id', 'users.id')
    .where('circle_members.circle_id', circleId)
    .select('users.id', 'users.first_name', 'users.photo_url');

  // For each member, check if they've done anything today
  const result = [];
  for (const member of members) {
    const hasHabitLog = await db('habit_logs')
      .where({ user_id: member.id, logged_date: today })
      .first();

    const hasCheckIn = await db('check_ins')
      .where({ user_id: member.id, check_in_date: today })
      .first();

    const hasFocusSession = await db('focus_sessions')
      .where({ user_id: member.id, completed: true })
      .whereRaw(`DATE(started_at) = ?`, [today])
      .first();

    result.push({
      userId: member.id,
      firstName: member.first_name,
      photoUrl: member.photo_url,
      activeToday: !!(hasHabitLog || hasCheckIn || hasFocusSession),
      habitLogged: !!hasHabitLog,
      checkedIn: !!hasCheckIn,
      focused: !!hasFocusSession,
    });
  }

  return result;
}
