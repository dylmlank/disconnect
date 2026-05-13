import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';

const router = Router();

// GET /api/feed/photos?circleId=<uuid>
// Returns challenge_logs + habit_logs with photos from circle members (last 7 days)
router.get('/photos', authenticate, async (req: Request, res: Response) => {
  const circleId = req.query.circleId as string | undefined;
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();

  // Build list of user IDs to include: circle members if circleId given, else all friends via circles
  let memberIds: string[] = [req.user.userId];

  if (circleId) {
    const members = await db('circle_members')
      .where('circle_id', circleId)
      .select('user_id');
    memberIds = members.map((m: any) => m.user_id);
  } else {
    // All circle members the user shares any circle with
    const circles = await db('circle_members')
      .where('user_id', req.user.userId)
      .select('circle_id');
    if (circles.length > 0) {
      const circleIds = circles.map((c: any) => c.circle_id);
      const members = await db('circle_members')
        .whereIn('circle_id', circleIds)
        .select('user_id');
      const ids = new Set(members.map((m: any) => m.user_id as string));
      ids.add(req.user.userId);
      memberIds = [...ids];
    }
  }

  // Query challenge_logs with photos
  const challengePhotos = await db('challenge_logs as cl')
    .join('users as u', 'cl.user_id', 'u.id')
    .join('challenges as c', 'cl.challenge_id', 'c.id')
    .whereIn('cl.user_id', memberIds)
    .whereNotNull('cl.photo_url')
    .where('cl.logged_at', '>=', sinceStr)
    .select(
      'cl.id',
      'cl.photo_url',
      'cl.logged_at',
      'cl.user_id',
      'u.first_name as user_name',
      'u.photo_url as user_photo',
      'c.title as source_name',
      db.raw(`'challenge' as source_type`),
    );

  // Query habit_logs with photos
  const habitPhotos = await db('habit_logs as hl')
    .join('users as u', 'hl.user_id', 'u.id')
    .whereIn('hl.user_id', memberIds)
    .whereNotNull('hl.photo_url')
    .where('hl.logged_at', '>=', sinceStr)
    .select(
      'hl.id',
      'hl.photo_url',
      'hl.logged_at',
      'hl.user_id',
      'u.first_name as user_name',
      'u.photo_url as user_photo',
      'hl.habit_id as source_name',
      db.raw(`'habit' as source_type`),
    );

  const photos = [...challengePhotos, ...habitPhotos]
    .map((p: any) => ({
      id: p.id,
      photoUrl: p.photo_url,
      loggedAt: p.logged_at instanceof Date ? p.logged_at.toISOString() : p.logged_at,
      userId: p.user_id,
      userName: p.user_name,
      userPhoto: p.user_photo,
      sourceName: p.source_name,
      sourceType: p.source_type,
    }))
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  res.json({ photos });
});

export default router;
