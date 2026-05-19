import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getMeetupSuggestions } from '../models/meetupSuggestion';

const router = Router();

// GET /api/suggestions/meetup — smart suggestions for who to meet up with
router.get('/meetup', authenticate, async (req: Request, res: Response) => {
  const suggestions = await getMeetupSuggestions(req.user.userId);
  res.json({ suggestions });
});

export default router;
