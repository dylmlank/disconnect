import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { createBlock, removeBlock, getBlockedUsers } from '../models/block';

const router = Router();

const blockSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/blocks
router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  if (parsed.data.userId === req.user.userId) {
    res.status(400).json({ error: 'validation', message: 'You cannot block yourself' });
    return;
  }

  await createBlock(req.user.userId, parsed.data.userId);
  res.json({ success: true });
});

// DELETE /api/blocks/:userId
router.delete('/:userId', authenticate, async (req: Request, res: Response) => {
  await removeBlock(req.user.userId, req.params.userId as string);
  res.json({ success: true });
});

// GET /api/blocks
router.get('/', authenticate, async (req: Request, res: Response) => {
  const blockedUsers = await getBlockedUsers(req.user.userId);
  res.json({ blockedUsers });
});

export default router;
