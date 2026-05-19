import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getMeetupSuggestions } from '../models/meetupSuggestion';
import { getEventSuggestions } from '../models/eventSuggestion';

const router = Router();

// GET /api/suggestions/meetup — smart suggestions for who to meet up with
router.get('/meetup', authenticate, async (req: Request, res: Response) => {
  const suggestions = await getMeetupSuggestions(req.user.userId);
  res.json({ suggestions });
});

// GET /api/suggestions/events — suggest group events from nearby active challenges
router.get('/events', authenticate, async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ message: 'lat and lng are required' });
    return;
  }

  const suggestions = await getEventSuggestions(req.user.userId, lat, lng);
  res.json({ suggestions });
});

export default router;
