import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireAdult } from '../middleware/ageGate';
import { rateLimit } from '../middleware/rateLimit';
import { CATEGORY_IDS } from '@disconnect/shared';
import {
  findEventsNearby,
  findEventById,
  findMyEvents,
  findSuggestedEvents,
  createEvent,
  addRsvp,
  removeRsvp,
  hasRsvp,
  deleteEvent,
} from '../models/event';
import { getChatMessages } from '../models/chatMessage';
import { findUserById } from '../models/user';

const router = Router();

const MILES_TO_METERS = 1609.34;
const DEFAULT_RADIUS_MILES = 25;

const listEventsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).optional(),
  category: z.string().optional(),
  search: z.string().max(100).optional(),
});

const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  address: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  category: z.enum(CATEGORY_IDS as [string, ...string[]]),
  maxAttendees: z.number().int().min(2).max(100).optional(),
  allAges: z.boolean(),
});

// GET /api/events
router.get('/', authenticate, async (req: Request, res: Response) => {
  const parsed = listEventsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radius, category, search } = parsed.data;
  const radiusMeters = (radius || DEFAULT_RADIUS_MILES) * MILES_TO_METERS;

  const events = await findEventsNearby({
    lat,
    lng,
    radiusMeters,
    userId: req.user.userId,
    isMinor: req.user.isMinor,
    category: category as typeof CATEGORY_IDS[number] | undefined,
    search,
  });

  res.json({ events });
});

// GET /api/events/mine
router.get('/mine', authenticate, async (req: Request, res: Response) => {
  const result = await findMyEvents(req.user.userId);
  res.json(result);
});

// GET /api/events/suggested
router.get('/suggested', authenticate, async (req: Request, res: Response) => {
  const parsed = listEventsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radius } = parsed.data;
  const radiusMeters = (radius || DEFAULT_RADIUS_MILES) * MILES_TO_METERS;

  const user = await findUserById(req.user.userId);
  if (!user || !user.interests || user.interests.length === 0) {
    res.json({ events: [] });
    return;
  }

  const events = await findSuggestedEvents({
    lat,
    lng,
    radiusMeters,
    userId: req.user.userId,
    isMinor: req.user.isMinor,
    interests: user.interests,
  });

  res.json({ events });
});

// POST /api/events
router.post('/', authenticate, requireAdult, rateLimit(3600, 10, 'create_event'), async (req: Request, res: Response) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const startDate = new Date(parsed.data.startsAt);
  if (startDate <= new Date()) {
    res.status(400).json({ error: 'validation', message: 'Event start time must be in the future' });
    return;
  }

  const eventId = await createEvent({
    creatorId: req.user.userId,
    title: parsed.data.title,
    description: parsed.data.description,
    lat: parsed.data.location.latitude,
    lng: parsed.data.location.longitude,
    address: parsed.data.address,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    category: parsed.data.category,
    maxAttendees: parsed.data.maxAttendees,
    allAges: parsed.data.allAges,
  });

  // Auto-RSVP the creator
  await addRsvp(eventId, req.user.userId);

  const event = await findEventById(eventId, req.user.userId);
  res.status(201).json({ event });
});

// GET /api/events/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const event = await findEventById(req.params.id as string, req.user.userId);
  if (!event) {
    res.status(404).json({ error: 'not_found', message: 'Event not found' });
    return;
  }

  // If minor and event is not all-ages, deny access
  if (req.user.isMinor && !event.allAges) {
    res.status(403).json({ error: 'age_restricted', message: 'This event is not available for your age group' });
    return;
  }

  res.json({ event });
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', authenticate, rateLimit(60, 10, 'rsvp'), async (req: Request, res: Response) => {
  const event = await findEventById(req.params.id as string, req.user.userId);
  if (!event) {
    res.status(404).json({ error: 'not_found', message: 'Event not found' });
    return;
  }

  if (req.user.isMinor && !event.allAges) {
    res.status(403).json({ error: 'age_restricted', message: 'This event is not available for your age group' });
    return;
  }

  const added = await addRsvp(req.params.id as string, req.user.userId);
  if (!added) {
    res.status(409).json({ error: 'full', message: 'Event is full' });
    return;
  }

  res.json({ success: true });
});

// DELETE /api/events/:id/rsvp
router.delete('/:id/rsvp', authenticate, async (req: Request, res: Response) => {
  await removeRsvp(req.params.id as string, req.user.userId);
  res.json({ success: true });
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const deleted = await deleteEvent(req.params.id as string, req.user.userId);
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Event not found or not yours' });
    return;
  }
  res.json({ success: true });
});

// GET /api/events/:id/chat
router.get('/:id/chat', authenticate, async (req: Request, res: Response) => {
  const rsvped = await hasRsvp(req.params.id as string, req.user.userId);
  if (!rsvped) {
    res.status(403).json({ error: 'not_rsvped', message: 'You must RSVP to access event chat' });
    return;
  }

  const messages = await getChatMessages(req.params.id as string, {
    before: req.query.before as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });

  res.json({ messages });
});

export default router;
