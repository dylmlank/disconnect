import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { CURATED_HABIT_IDS } from '@disconnect/shared';
import {
  getUserHabits,
  addHabit,
  removeHabit,
  logHabit,
  unlogHabit,
  getStreaks,
} from '../models/habit';

const router = Router();

const addHabitSchema = z.object({
  habitId: z.string().min(1).max(50),
  customName: z.string().max(50).optional(),
});

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /api/habits
router.get('/', authenticate, async (req: Request, res: Response) => {
  const result = await getUserHabits(req.user.userId);
  res.json(result);
});

// GET /api/habits/streaks
router.get('/streaks', authenticate, async (req: Request, res: Response) => {
  const streaks = await getStreaks(req.user.userId);
  res.json({ streaks });
});

// POST /api/habits
router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = addHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { habitId, customName } = parsed.data;

  // Validate it's a known curated habit (or custom)
  if (!(CURATED_HABIT_IDS as readonly string[]).includes(habitId)) {
    res.status(400).json({ error: 'validation', message: 'Unknown habit ID' });
    return;
  }

  try {
    const habit = await addHabit(req.user.userId, habitId, customName);
    res.status(201).json({ habit });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'MAX_HABITS') {
      res.status(409).json({ error: 'max_habits', message: (err as unknown as Error).message });
      return;
    }
    throw err;
  }
});

// DELETE /api/habits/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const deleted = await removeHabit(req.user.userId, req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Habit not found' });
    return;
  }
  res.json({ success: true });
});

// POST /api/habits/:habitId/log
router.post('/:habitId/log', authenticate, async (req: Request, res: Response) => {
  const log = await logHabit(req.user.userId, req.params.habitId as string);
  res.json({ log });
});

// DELETE /api/habits/:habitId/log/:date
router.delete('/:habitId/log/:date', authenticate, async (req: Request, res: Response) => {
  const parsed = dateSchema.safeParse({ date: req.params.date });
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: 'Invalid date format (use YYYY-MM-DD)' });
    return;
  }

  const deleted = await unlogHabit(req.user.userId, req.params.habitId as string, parsed.data.date);
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Log not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
