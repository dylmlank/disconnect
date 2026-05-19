import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { findUserById, updateUser, toUser } from '../models/user';
import { uploadPhoto } from '../services/storage';
import { INTEREST_IDS, MIN_INTERESTS, MAX_INTERESTS, LEVELS } from '@disconnect/shared';
import { getUserLevel } from '../models/level';
import { db } from '../config/database';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  bio: z.string().max(140).optional(),
  interests: z
    .array(z.string().refine((id) => INTEREST_IDS.includes(id)))
    .min(MIN_INTERESTS)
    .max(MAX_INTERESTS)
    .optional(),
});

// GET /api/users/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'not_found', message: 'User not found' });
    return;
  }

  res.json({ user: toUser(user) });
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.firstName) updates.first_name = parsed.data.firstName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.interests) updates.interests = parsed.data.interests;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'validation', message: 'No fields to update' });
    return;
  }

  const user = await updateUser(req.user.userId, updates);
  res.json({ user: toUser(user) });
});

// POST /api/users/me/photo
router.post('/me/photo', authenticate, upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'validation', message: 'No photo provided' });
    return;
  }

  const photoUrl = await uploadPhoto(req.file.buffer, req.file.mimetype);
  await updateUser(req.user.userId, { photo_url: photoUrl });

  res.json({ photoUrl });
});

// PUT /api/users/me/device-token
router.put('/me/device-token', authenticate, async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'validation', message: 'Device token required' });
    return;
  }

  await updateUser(req.user.userId, { device_token: token });
  res.json({ success: true });
});

// PUT /api/users/me/location — update approximate location
router.put('/me/location', authenticate, async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400).json({ error: 'validation', message: 'latitude and longitude required' });
    return;
  }

  await db.raw(
    `UPDATE users SET approximate_location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?`,
    [longitude, latitude, req.user.userId],
  );

  res.json({ success: true });
});

// DELETE /api/users/me — delete account and all associated data
router.delete('/me', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.userId;

  // Delete in order respecting foreign keys
  await db('reactions').where('user_id', userId).del();
  await db('habit_logs').where('user_id', userId).del();
  await db('user_habits').where('user_id', userId).del();
  await db('check_ins').where('user_id', userId).del();
  await db('challenge_logs').where('user_id', userId).del();
  await db('challenge_participants').where('user_id', userId).del();
  await db('focus_sessions').where('user_id', userId).del();
  await db('circle_members').where('user_id', userId).del();
  await db('beacon_interests').where('user_id', userId).del();
  await db('event_rsvps').where('user_id', userId).del();
  await db('event_chat_messages').where('sender_id', userId).del();
  await db('blocks').where('blocker_id', userId).orWhere('blocked_id', userId).del();
  await db('reports').where('reporter_id', userId).del();

  // Delete circles created by user
  const userCircles = await db('circles').where('creator_id', userId).select('id');
  for (const c of userCircles) {
    await db('circle_members').where('circle_id', c.id).del();
    await db('circles').where('id', c.id).del();
  }

  // Delete events created by user
  const userEvents = await db('events').where('creator_id', userId).select('id');
  for (const e of userEvents) {
    await db('event_chat_messages').where('event_id', e.id).del();
    await db('event_rsvps').where('event_id', e.id).del();
    await db('events').where('id', e.id).del();
  }

  // Delete beacons and challenges created by user
  await db('beacons').where('creator_id', userId).del();
  await db('challenges').where('creator_id', userId).del();

  // Finally delete the user
  await db('users').where('id', userId).del();

  res.json({ success: true });
});

// GET /api/users/me/stats
router.get('/me/stats', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const now = new Date();

  // Events attended this month (RSVP'd events where start time has passed)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyResult = await db('event_rsvps')
    .join('events', 'event_rsvps.event_id', 'events.id')
    .where('event_rsvps.user_id', userId)
    .where('events.starts_at', '<', now)
    .where('events.starts_at', '>=', startOfMonth)
    .count('* as count')
    .first();

  // All-time events attended
  const allTimeResult = await db('event_rsvps')
    .join('events', 'event_rsvps.event_id', 'events.id')
    .where('event_rsvps.user_id', userId)
    .where('events.starts_at', '<', now)
    .count('* as count')
    .first();

  // Weekly streak: count consecutive weeks (going back from current) with at least 1 attended event
  const weeksResult = await db.raw(`
    SELECT DISTINCT date_trunc('week', e.starts_at) as week_start
    FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = ?
      AND e.starts_at < NOW()
    ORDER BY week_start DESC
  `, [userId]);

  let streak = 0;
  const weeks = weeksResult.rows;
  if (weeks.length > 0) {
    // Check if current or last week had an event, then count consecutive
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    let checkWeek = currentWeekStart;
    for (const row of weeks) {
      const weekStart = new Date(row.week_start);
      weekStart.setHours(0, 0, 0, 0);

      const diffDays = Math.round((checkWeek.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        streak++;
        checkWeek = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Beacons dropped all-time
  const beaconsResult = await db('beacons')
    .where('creator_id', userId)
    .count('* as count')
    .first();

  // Daily engagement streak: consecutive days with a habit log OR check-in OR vibe
  const engagementDays = await db.raw(`
    SELECT DISTINCT active_date FROM (
      SELECT DATE(created_at) as active_date FROM habit_logs
        WHERE user_id = ? AND created_at > NOW() - INTERVAL '90 days'
      UNION
      SELECT check_in_date as active_date FROM check_ins
        WHERE user_id = ? AND check_in_date > (CURRENT_DATE - INTERVAL '90 days')
      UNION
      SELECT DATE(created_at) as active_date FROM vibes
        WHERE user_id = ? AND created_at > NOW() - INTERVAL '90 days'
    ) combined
    ORDER BY active_date DESC
  `, [userId, userId, userId]);

  let dailyStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = new Date(today);
  for (const row of engagementDays.rows) {
    const rowDate = typeof row.active_date === 'string'
      ? row.active_date.slice(0, 10)
      : new Date(row.active_date).toISOString().slice(0, 10);
    const checkStr = checkDate.toISOString().slice(0, 10);
    if (rowDate === checkStr) {
      dailyStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (rowDate < checkStr) {
      // Missed a day — streak broken
      break;
    }
  }

  res.json({
    stats: {
      eventsThisMonth: Number(monthlyResult?.count || 0),
      eventsAllTime: Number(allTimeResult?.count || 0),
      weeklyStreak: streak,
      dailyStreak,
      beaconsDropped: Number(beaconsResult?.count || 0),
    },
  });
});

// GET /api/users/me/level
router.get('/me/level', authenticate, async (req: Request, res: Response) => {
  const levelData = await getUserLevel(req.user.userId);
  res.json({ level: levelData });
});

// GET /api/users/me/milestones
router.get('/me/milestones', authenticate, async (req: Request, res: Response) => {
  const { xp, current, next } = await getUserLevel(req.user.userId);

  // All levels up to and including the current one have been unlocked
  const unlocked = LEVELS
    .filter((l) => l.level <= current.level && l.unlocks !== null)
    .map((l) => ({ level: l.level, name: l.name, emoji: l.emoji, feature: l.unlocks as string }));

  // Locked = levels above current that have something to unlock
  const locked = LEVELS
    .filter((l) => l.level > current.level && l.unlocks !== null)
    .map((l) => ({ level: l.level, name: l.name, emoji: l.emoji, feature: l.unlocks as string, xpRequired: l.xpRequired }));

  res.json({
    milestones: {
      xp,
      currentLevel: {
        level: current.level,
        name: current.name,
        emoji: current.emoji,
        unlocks: current.unlocks,
      },
      nextLevel: next
        ? { level: next.level, name: next.name, emoji: next.emoji, xpRequired: next.xpRequired, unlocks: next.unlocks }
        : null,
      xpToNextLevel: next ? next.xpRequired - xp : null,
      unlocked,
      locked,
    },
  });
});

// GET /api/users/:id — view another user's public profile (MUST be last — catches all /:id)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const targetId = req.params.id as string;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(targetId)) {
    res.status(400).json({ error: 'validation', message: 'Invalid user ID' });
    return;
  }

  const user = await findUserById(targetId);
  if (!user) {
    res.status(404).json({ error: 'not_found', message: 'User not found' });
    return;
  }

  const profile = {
    id: user.id,
    firstName: user.first_name,
    bio: user.bio,
    interests: user.interests,
    photoUrl: user.photo_url,
    isMinor: user.is_minor,
  };

  const eventsAttended = await db('event_rsvps')
    .join('events', 'event_rsvps.event_id', 'events.id')
    .where('event_rsvps.user_id', targetId)
    .where('events.starts_at', '<', new Date())
    .count('* as count')
    .first();

  const challengesCompleted = await db('challenge_participants')
    .where({ user_id: targetId, completed: true })
    .count('* as count')
    .first();

  const weeksResult = await db.raw(`
    SELECT COUNT(DISTINCT date_trunc('week', e.starts_at)) as weeks
    FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = ?
      AND e.starts_at < NOW()
      AND e.starts_at > NOW() - INTERVAL '8 weeks'
  `, [targetId]);

  res.json({
    user: profile,
    stats: {
      eventsAttended: Number(eventsAttended?.count || 0),
      challengesCompleted: Number(challengesCompleted?.count || 0),
      currentStreak: Number(weeksResult.rows[0]?.weeks || 0),
    },
  });
});

export default router;
