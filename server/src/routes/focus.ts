import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import {
  startSession,
  completeSession,
  cancelSession,
  getActiveSessions,
  getSessionHistory,
} from '../models/focusSession';

const router = Router();

const startSchema = z.object({
  durationMinutes: z.number().int().min(1).max(480),
  intention: z.string().max(100).optional(),
  circleId: z.string().uuid().optional(),
});

// POST /api/focus — start a session
router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { durationMinutes, intention, circleId } = parsed.data;
  const session = await startSession(req.user.userId, durationMinutes, intention, circleId);
  res.status(201).json({ session });
});

// POST /api/focus/:id/complete
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  const session = await completeSession(req.params.id as string, req.user.userId);
  if (!session) {
    res.status(404).json({ error: 'not_found', message: 'Active session not found' });
    return;
  }
  res.json({ session });
});

// POST /api/focus/:id/cancel
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  const session = await cancelSession(req.params.id as string, req.user.userId);
  if (!session) {
    res.status(404).json({ error: 'not_found', message: 'Active session not found' });
    return;
  }
  res.json({ session });
});

// GET /api/focus/active?circleId=
router.get('/active', authenticate, async (req: Request, res: Response) => {
  const circleId = typeof req.query.circleId === 'string' ? req.query.circleId : undefined;
  const sessions = await getActiveSessions(circleId);
  res.json({ sessions });
});

// GET /api/focus/history?limit=
router.get('/history', authenticate, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const sessions = await getSessionHistory(req.user.userId, limit);
  res.json({ sessions });
});

export default router;
