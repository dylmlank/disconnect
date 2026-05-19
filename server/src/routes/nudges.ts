import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { sendNudge, getNudgesForUser, getCircleMembersActivity } from '../models/nudge';

const router = Router();

const sendNudgeSchema = z.object({
  toUserId: z.string().uuid(),
  circleId: z.string().uuid(),
  message: z.string().max(100).optional(),
});

// POST /api/nudges — send a nudge to a circle member
router.post('/', authenticate, rateLimit(60, 20, 'nudge'), async (req: Request, res: Response) => {
  const parsed = sendNudgeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const result = await sendNudge(
    req.user.userId,
    parsed.data.toUserId,
    parsed.data.circleId,
    parsed.data.message,
  );

  if (result.error) {
    const status = result.error === 'not_in_circle' ? 403
      : result.error === 'cooldown' ? 429
      : result.error === 'daily_limit' ? 429
      : result.error === 'self_nudge' ? 400
      : 400;
    res.status(status).json({ error: result.error, message: result.message });
    return;
  }

  res.status(201).json({ nudge: result.nudge });
});

// GET /api/nudges — get nudges sent to me
router.get('/', authenticate, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const nudges = await getNudgesForUser(req.user.userId, limit);
  res.json({ nudges });
});

// GET /api/nudges/circle/:circleId/activity — who's been active today in this circle
router.get('/circle/:circleId/activity', authenticate, async (req: Request, res: Response) => {
  const activity = await getCircleMembersActivity(req.params.circleId as string);
  res.json({ members: activity });
});

export default router;
