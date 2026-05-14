import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getRecentActivity, getCircleActivity } from '../models/activity';

const router = Router();

const MILES_TO_METERS = 1609.34;
const DEFAULT_RADIUS_MILES = 25;

const activitySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).optional(),
});

// GET /api/activity
router.get('/', authenticate, async (req: Request, res: Response) => {
  const parsed = activitySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radius } = parsed.data;
  const radiusMeters = (radius || DEFAULT_RADIUS_MILES) * MILES_TO_METERS;

  const activity = await getRecentActivity({
    lat,
    lng,
    radiusMeters,
    userId: req.user.userId,
  });

  res.json({ activity });
});

// GET /api/activity/circle — recent actions by circle members
router.get('/circle', authenticate, async (req: Request, res: Response) => {
  const activities = await getCircleActivity(req.user.userId);
  res.json({ activities });
});

export default router;
