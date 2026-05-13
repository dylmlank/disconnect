import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { addReaction, removeReaction } from '../models/reaction';
import type { ReactionTargetType } from '@disconnect/shared';

const router = Router();

const VALID_TARGET_TYPES: ReactionTargetType[] = ['habit_log', 'check_in', 'challenge_log', 'focus_session'];
const VALID_EMOJIS = ['🔥', '👏', '💪', '❤️', '🎉', '⭐'];

const createReactionSchema = z.object({
  targetType: z.enum(VALID_TARGET_TYPES as [string, ...string[]]),
  targetId: z.string().uuid(),
  emoji: z.string().refine((e) => VALID_EMOJIS.includes(e), { message: 'Invalid emoji' }),
});

// POST /api/reactions
router.post('/', authenticate, rateLimit(60, 30, 'reaction_write'), async (req: Request, res: Response) => {
  const parsed = createReactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const reaction = await addReaction(
    req.user.userId,
    parsed.data.targetType as ReactionTargetType,
    parsed.data.targetId,
    parsed.data.emoji,
  );

  res.status(201).json({ reaction });
});

// DELETE /api/reactions/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const deleted = await removeReaction(req.params.id as string, req.user.userId);
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Reaction not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
