import { db } from '../config/database';
import crypto from 'crypto';

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex'); // 8 hex chars
}

export async function createCircle(params: {
  creatorId: string;
  name: string;
  description?: string;
  skillIds?: string[];
  isPublic?: boolean;
  maxMembers?: number;
}) {
  const { creatorId, name, description, skillIds, isPublic = true, maxMembers = 50 } = params;

  // Check max circles per user (increased from 3 to 10 for learning focus)
  const memberCount = await db('circle_members')
    .where('user_id', creatorId)
    .count('* as count')
    .first();
  if (memberCount && Number(memberCount.count) >= 10) {
    return { error: 'max_circles', message: 'You can only be in 10 circles at a time' };
  }

  const inviteCode = generateInviteCode();

  const [circle] = await db('circles')
    .insert({
      name,
      description: description ?? null,
      creator_id: creatorId,
      invite_code: inviteCode,
      is_public: isPublic,
      max_members: maxMembers,
    })
    .returning('*');

  // Auto-add creator as member
  await db('circle_members').insert({ circle_id: circle.id, user_id: creatorId });

  // Add skills if provided
  if (skillIds && skillIds.length > 0) {
    await db('circle_skills').insert(
      skillIds.map((skillId) => ({
        circle_id: circle.id,
        skill_id: skillId,
      })),
    );
  }

  return { circle: toCircle(circle) };
}

export async function joinCircle(userId: string, inviteCode: string) {
  // Check max circles per user
  const memberCount = await db('circle_members')
    .where('user_id', userId)
    .count('* as count')
    .first();
  if (memberCount && Number(memberCount.count) >= 10) {
    return { error: 'max_circles', message: 'You can only be in 10 circles at a time' };
  }

  const circle = await db('circles').where('invite_code', inviteCode).first();
  if (!circle) {
    return { error: 'not_found', message: 'Invalid invite code' };
  }

  // Check max members (configurable per circle)
  const maxMembers = circle.max_members || 50;
  const currentMembers = await db('circle_members')
    .where('circle_id', circle.id)
    .count('* as count')
    .first();
  if (currentMembers && Number(currentMembers.count) >= maxMembers) {
    return { error: 'full', message: `This circle is full (max ${maxMembers} members)` };
  }

  // Check not already a member
  const existing = await db('circle_members')
    .where({ circle_id: circle.id, user_id: userId })
    .first();
  if (existing) {
    return { error: 'already_member', message: 'You are already in this circle' };
  }

  await db('circle_members').insert({ circle_id: circle.id, user_id: userId });
  return { circle: toCircle(circle) };
}

export async function leaveCircle(userId: string, circleId: string) {
  const circle = await db('circles').where('id', circleId).first();
  if (!circle) return false;

  // Creator cannot leave — must delete circle
  if (circle.creator_id === userId) {
    // If creator leaves, delete the circle
    await db('circles').where('id', circleId).del();
    return true;
  }

  await db('circle_members').where({ circle_id: circleId, user_id: userId }).del();
  return true;
}

export async function removeMember(requesterId: string, circleId: string, targetUserId: string) {
  const circle = await db('circles').where('id', circleId).first();
  if (!circle) return { error: 'not_found' };
  if (circle.creator_id !== requesterId) return { error: 'forbidden' };
  if (targetUserId === requesterId) return { error: 'cannot_remove_self' };

  await db('circle_members').where({ circle_id: circleId, user_id: targetUserId }).del();
  return { success: true };
}

export async function getUserCircles(userId: string) {
  const rows = await db('circles')
    .join('circle_members', 'circles.id', 'circle_members.circle_id')
    .where('circle_members.user_id', userId)
    .select(
      'circles.*',
      db.raw(
        `(SELECT COUNT(*) FROM circle_members WHERE circle_members.circle_id = circles.id)::int as member_count`,
      ),
    );

  return rows.map(toCircle);
}

export async function getCircleDetail(circleId: string, userId: string) {
  const circle = await db('circles')
    .where('circles.id', circleId)
    .select(
      'circles.*',
      db.raw(
        `(SELECT COUNT(*) FROM circle_members WHERE circle_members.circle_id = circles.id)::int as member_count`,
      ),
    )
    .first();

  if (!circle) return null;

  // Verify user is a member
  const isMember = await db('circle_members')
    .where({ circle_id: circleId, user_id: userId })
    .first();
  if (!isMember) return null;

  const members = await db('circle_members')
    .join('users', 'circle_members.user_id', 'users.id')
    .where('circle_members.circle_id', circleId)
    .select(
      'users.id as user_id',
      'users.first_name',
      'users.photo_url',
      'circle_members.joined_at',
    );

  return {
    ...toCircle(circle),
    members: members.map((m: any) => ({
      userId: m.user_id,
      firstName: m.first_name,
      photoUrl: m.photo_url,
      joinedAt: m.joined_at.toISOString(),
    })),
  };
}

export async function getCircleFeed(circleId: string, userId: string, since?: string) {
  // Verify membership
  const isMember = await db('circle_members')
    .where({ circle_id: circleId, user_id: userId })
    .first();
  if (!isMember) return null;

  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get member IDs
  const memberRows = await db('circle_members').where('circle_id', circleId).select('user_id');
  const memberIds = memberRows.map((m: any) => m.user_id);

  if (memberIds.length === 0) return [];

  // Aggregate from habit_logs, check_ins, challenge_logs, focus_sessions
  const habitLogs = await db('habit_logs')
    .join('users', 'habit_logs.user_id', 'users.id')
    .whereIn('habit_logs.user_id', memberIds)
    .where('habit_logs.logged_at', '>=', sinceDate)
    .select(
      'habit_logs.id',
      'habit_logs.user_id',
      'users.first_name',
      'users.photo_url',
      'habit_logs.habit_id',
      'habit_logs.logged_at',
    )
    .orderBy('habit_logs.logged_at', 'desc')
    .limit(15);

  const checkIns = await db('check_ins')
    .join('users', 'check_ins.user_id', 'users.id')
    .whereIn('check_ins.user_id', memberIds)
    .where('check_ins.created_at', '>=', sinceDate)
    .select(
      'check_ins.id',
      'check_ins.user_id',
      'users.first_name',
      'users.photo_url',
      'check_ins.mood',
      'check_ins.created_at',
    )
    .orderBy('check_ins.created_at', 'desc')
    .limit(10);

  const focusSessions = await db('focus_sessions')
    .join('users', 'focus_sessions.user_id', 'users.id')
    .whereIn('focus_sessions.user_id', memberIds)
    .where('focus_sessions.created_at', '>=', sinceDate)
    .where('focus_sessions.completed', true)
    .select(
      'focus_sessions.id',
      'focus_sessions.user_id',
      'users.first_name',
      'users.photo_url',
      'focus_sessions.duration_minutes',
      'focus_sessions.intention',
      'focus_sessions.created_at',
    )
    .orderBy('focus_sessions.created_at', 'desc')
    .limit(10);

  const challengeLogs = await db('challenge_logs')
    .join('users', 'challenge_logs.user_id', 'users.id')
    .join('challenges', 'challenge_logs.challenge_id', 'challenges.id')
    .whereIn('challenge_logs.user_id', memberIds)
    .where('challenge_logs.logged_at', '>=', sinceDate)
    .where('challenges.circle_id', circleId)
    .select(
      'challenge_logs.id',
      'challenge_logs.user_id',
      'users.first_name',
      'users.photo_url',
      'challenges.title as challenge_title',
      'challenge_logs.day_number',
      'challenge_logs.logged_at',
    )
    .orderBy('challenge_logs.logged_at', 'desc')
    .limit(10);

  // Build unified feed
  const moodEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];

  const feed = [
    ...habitLogs.map((h: any) => ({
      id: `habit_${h.id}`,
      type: 'habit_log' as const,
      userId: h.user_id,
      userName: h.first_name,
      userPhotoUrl: h.photo_url,
      message: `completed ${h.habit_id}`,
      timestamp: h.logged_at.toISOString(),
      targetId: h.id,
      reactions: [],
    })),
    ...checkIns.map((c: any) => ({
      id: `checkin_${c.id}`,
      type: 'check_in' as const,
      userId: c.user_id,
      userName: c.first_name,
      userPhotoUrl: c.photo_url,
      message: `checked in ${moodEmojis[c.mood]}`,
      timestamp: c.created_at.toISOString(),
      targetId: c.id,
      reactions: [],
    })),
    ...focusSessions.map((f: any) => ({
      id: `focus_${f.id}`,
      type: 'focus_session' as const,
      userId: f.user_id,
      userName: f.first_name,
      userPhotoUrl: f.photo_url,
      message: `focused for ${f.duration_minutes}min${f.intention ? ` on "${f.intention}"` : ''}`,
      timestamp: f.created_at.toISOString(),
      targetId: f.id,
      reactions: [],
    })),
    ...challengeLogs.map((cl: any) => ({
      id: `challenge_${cl.id}`,
      type: 'challenge_log' as const,
      userId: cl.user_id,
      userName: cl.first_name,
      userPhotoUrl: cl.photo_url,
      message: `completed day ${cl.day_number} of "${cl.challenge_title}"`,
      timestamp: cl.logged_at.toISOString(),
      targetId: cl.id,
      reactions: [],
    })),
  ];

  // Sort by timestamp desc, limit 50
  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return feed.slice(0, 50);
}

export async function discoverCirclesBySkill(params: {
  userId: string;
  skillId: string;
  limit?: number;
}) {
  const { userId, skillId, limit = 20 } = params;

  // Find public circles with this skill, that user is not already a member of
  const circles = await db('circles as c')
    .join('circle_skills as cs', 'c.id', 'cs.circle_id')
    .where('cs.skill_id', skillId)
    .where('c.is_public', true)
    .whereNotIn('c.id', function (this: any) {
      this.select('circle_id').from('circle_members').where('user_id', userId);
    })
    .select(
      'c.*',
      db.raw(
        `(SELECT COUNT(*) FROM circle_members WHERE circle_members.circle_id = c.id)::int as member_count`,
      ),
    )
    .orderBy('member_count', 'desc')
    .limit(limit);

  return circles.map(toCircle);
}

export async function searchCircles(params: { userId: string; query: string; limit?: number }) {
  const { userId, query, limit = 20 } = params;

  const circles = await db('circles as c')
    .where('c.is_public', true)
    .where((qb) => {
      qb.whereILike('c.name', `%${query}%`).orWhereILike('c.description', `%${query}%`);
    })
    .whereNotIn('c.id', function (this: any) {
      this.select('circle_id').from('circle_members').where('user_id', userId);
    })
    .select(
      'c.*',
      db.raw(
        `(SELECT COUNT(*) FROM circle_members WHERE circle_members.circle_id = c.id)::int as member_count`,
      ),
    )
    .orderBy('member_count', 'desc')
    .limit(limit);

  return circles.map(toCircle);
}

function toCircle(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    creatorId: row.creator_id,
    inviteCode: row.invite_code,
    isPublic: row.is_public ?? true,
    maxMembers: row.max_members || 50,
    memberCount: row.member_count || 0,
    createdAt: row.created_at.toISOString(),
  };
}
