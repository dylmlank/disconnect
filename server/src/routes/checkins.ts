import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { createCheckIn, getTodayCheckIn, getCheckInHistory } from '../models/checkin';

const router = Router();

const createCheckInSchema = z.object({
  mood: z.number().int().min(1).max(5),
  goodThing1: z.string().min(1).max(100),
  goodThing2: z.string().min(1).max(100),
  goodThing3: z.string().min(1).max(100),
  intention: z.string().max(50).optional(),
});

// POST /api/checkins
router.post('/', authenticate, rateLimit(3600, 5, 'create_checkin'), async (req: Request, res: Response) => {
  const parsed = createCheckInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  try {
    const checkIn = await createCheckIn(req.user.userId, {
      mood: parsed.data.mood,
      goodThing1: parsed.data.goodThing1,
      goodThing2: parsed.data.goodThing2,
      goodThing3: parsed.data.goodThing3,
      intention: parsed.data.intention,
    });
    res.status(201).json({ checkIn });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ALREADY_CHECKED_IN') {
      res.status(409).json({ error: 'already_checked_in', message: (err as unknown as Error).message });
      return;
    }
    throw err;
  }
});

// GET /api/checkins/today
router.get('/today', authenticate, async (req: Request, res: Response) => {
  const checkIn = await getTodayCheckIn(req.user.userId);
  res.json({ checkIn });
});

// GET /api/checkins
router.get('/', authenticate, async (req: Request, res: Response) => {
  const checkIns = await getCheckInHistory(req.user.userId, 30);
  res.json({ checkIns });
});

export default router;
