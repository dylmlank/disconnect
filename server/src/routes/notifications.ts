import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getPreferences, updatePreferences } from '../models/notificationPrefs';

const router = Router();

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const updatePrefsSchema = z.object({
  eventReminders: z.boolean().optional(),
  challengeReminders: z.boolean().optional(),
  circleActivity: z.boolean().optional(),
  beaconInterest: z.boolean().optional(),
  chatMessages: z.boolean().optional(),
  habitReminderTime: z.string().regex(TIME_REGEX).nullable().optional(),
  checkinReminderTime: z.string().regex(TIME_REGEX).nullable().optional(),
});

// GET /api/notifications/preferences
router.get('/preferences', authenticate, async (req: Request, res: Response) => {
  const prefs = await getPreferences(req.user.userId);
  res.json({ preferences: prefs });
});

// PATCH /api/notifications/preferences
router.patch('/preferences', authenticate, async (req: Request, res: Response) => {
  const parsed = updatePrefsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const prefs = await updatePreferences(req.user.userId, parsed.data);
  res.json({ preferences: prefs });
});

export default router;
