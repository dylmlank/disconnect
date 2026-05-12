import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireAdult } from '../middleware/ageGate';
import {
  getPublicChallenges,
  getUserChallenges,
  getChallengeDetail,
  createChallenge,
  joinChallenge,
  logDay,
  getTemplates,
} from '../models/challenge';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  durationDays: z.number().int().min(1).max(365),
  dailyRequirement: z.string().min(1).max(200),
  category: z.enum(['phone_free', 'walk', 'deep_work', 'digital_sunset', 'gratitude', 'custom']),
  researchNote: z.string().max(300).optional().nullable(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isPublic: z.boolean(),
  circleId: z.string().uuid().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

const logDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  completed: z.boolean(),
  photoUrl: z.string().url().optional().nullable(),
});

// GET /api/challenges/templates
router.get('/templates', authenticate, (_req: Request, res: Response) => {
  res.json({ templates: getTemplates() });
});

// GET /api/challenges?lat&lng&type=public|mine
router.get('/', authenticate, async (req: Request, res: Response) => {
  const type = req.query.type === 'mine' ? 'mine' : 'public';

  if (type === 'mine') {
    const challenges = await getUserChallenges(req.user.userId);
    res.json({ challenges });
    return;
  }

  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'validation', message: 'lat and lng are required for public challenges' });
    return;
  }

  const challenges = await getPublicChallenges(lat, lng, 50000, req.user.userId);
  res.json({ challenges });
});

// POST /api/challenges
router.post('/', authenticate, requireAdult, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const id = await createChallenge({ ...parsed.data, creatorId: req.user.userId });
  res.status(201).json({ id });
});

// GET /api/challenges/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const detail = await getChallengeDetail(req.params.id as string, req.user.userId);
  if (!detail) {
    res.status(404).json({ error: 'not_found', message: 'Challenge not found' });
    return;
  }
  res.json({ challenge: detail });
});

// POST /api/challenges/:id/join
router.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  const ok = await joinChallenge(req.params.id as string, req.user.userId);
  if (!ok) {
    res.status(404).json({ error: 'not_found', message: 'Challenge not found' });
    return;
  }
  res.json({ success: true });
});

// POST /api/challenges/:id/log
router.post('/:id/log', authenticate, async (req: Request, res: Response) => {
  const parsed = logDaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { dayNumber, completed, photoUrl } = parsed.data;
  await logDay(req.params.id as string, req.user.userId, dayNumber, completed, photoUrl);
  res.json({ success: true });
});

export default router;
