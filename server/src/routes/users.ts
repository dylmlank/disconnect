import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { findUserById, updateUser, toUser } from '../models/user';
import { uploadPhoto } from '../services/storage';
import { INTEREST_IDS, MIN_INTERESTS, MAX_INTERESTS } from '@disconnect/shared';
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

  res.json({
    stats: {
      eventsThisMonth: Number(monthlyResult?.count || 0),
      eventsAllTime: Number(allTimeResult?.count || 0),
      weeklyStreak: streak,
      beaconsDropped: Number(beaconsResult?.count || 0),
    },
  });
});

export default router;
