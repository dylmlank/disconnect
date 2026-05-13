import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserBadges, checkAndAwardBadges } from '../models/badge';

const router = Router();

// GET /api/badges — get user's earned badges
router.get('/', authenticate, async (req: Request, res: Response) => {
  // Check for new badges every time they visit
  const newBadges = await checkAndAwardBadges(req.user.userId);
  const badges = await getUserBadges(req.user.userId);

  res.json({ badges, newBadges });
});

export default router;
