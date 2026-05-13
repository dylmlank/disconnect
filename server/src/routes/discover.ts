import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';
import { getBlockedUserIds } from '../models/block';

const router = Router();

const MILES_TO_METERS = 1609.34;

const discoverSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).optional(),
});

// GET /api/discover/people — find people nearby with shared interests
router.get('/people', authenticate, async (req: Request, res: Response) => {
  const parsed = discoverSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radius } = parsed.data;
  const radiusMeters = (radius || 25) * MILES_TO_METERS;
  const userId = req.user.userId;

  // Get current user's interests
  const currentUser = await db('users').where('id', userId).select('interests').first();
  if (!currentUser || !currentUser.interests || currentUser.interests.length === 0) {
    res.json({ people: [] });
    return;
  }

  const blockedIds = await getBlockedUserIds(userId);

  // Find users nearby with overlapping interests
  // Only show users who have set their approximate_location
  let query = db('users')
    .select(
      'users.id',
      'users.first_name',
      'users.bio',
      'users.interests',
      'users.photo_url',
      'users.is_minor',
      db.raw(
        `ST_Distance(users.approximate_location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance`,
        [lng, lat],
      ),
    )
    .whereNotNull('users.approximate_location')
    .whereRaw(
      `ST_DWithin(users.approximate_location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
      [lng, lat, radiusMeters],
    )
    .where('users.id', '!=', userId)
    .where('users.is_minor', false); // Don't show minors in discovery

  if (blockedIds.length > 0) {
    query = query.whereNotIn('users.id', blockedIds);
  }

  const users = await query.orderBy('distance', 'asc').limit(30);

  // Score by shared interests
  const myInterests = new Set(currentUser.interests);
  const scored = users
    .map((u: any) => {
      const shared = (u.interests || []).filter((i: string) => myInterests.has(i));
      return {
        id: u.id,
        firstName: u.first_name,
        bio: u.bio,
        interests: u.interests,
        photoUrl: u.photo_url,
        sharedInterests: shared,
        distance: Math.round(u.distance),
      };
    })
    .filter((u: any) => u.sharedInterests.length > 0) // Only show people with at least 1 shared interest
    .sort((a: any, b: any) => b.sharedInterests.length - a.sharedInterests.length);

  res.json({ people: scored });
});

export default router;
