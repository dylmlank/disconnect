import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { setVibe, getTodayVibe, getCircleVibes, getVibeHistory, VIBE_OPTIONS, VibeType } from '../models/vibe';

const router = Router();

const VALID_VIBES = VIBE_OPTIONS.map((v) => v.id);

const setVibeSchema = z.object({
  vibe: z.enum(VALID_VIBES as [string, ...string[]]),
});

// POST /api/vibes
router.post('/', authenticate, rateLimit(60, 10, 'vibe_write'), async (req: Request, res: Response) => {
  const parsed = setVibeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const result = await setVibe(req.user.userId, parsed.data.vibe as VibeType);
  res.json(result);
});

// GET /api/vibes/today
router.get('/today', authenticate, async (req: Request, res: Response) => {
  const vibe = await getTodayVibe(req.user.userId);
  res.json({ vibe });
});

// GET /api/vibes/circle/:circleId
router.get('/circle/:circleId', authenticate, async (req: Request, res: Response) => {
  const vibes = await getCircleVibes(req.params.circleId as string);
  res.json({ vibes });
});

// GET /api/vibes/history
router.get('/history', authenticate, async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
  const history = await getVibeHistory(req.user.userId, days);
  res.json({ history });
});

export default router;
