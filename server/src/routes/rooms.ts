import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { createRoom, getPublicRooms, getRoomById, joinRoom, leaveRoom, ROOM_VIBES } from '../models/studyRoom';

const router = Router();

const VALID_VIBES = ROOM_VIBES.map((v) => v.id);

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  vibe: z.enum(VALID_VIBES as [string, ...string[]]),
  isPublic: z.boolean().optional().default(true),
  circleId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// GET /api/rooms
router.get('/', authenticate, async (req: Request, res: Response) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
  const rooms = await getPublicRooms(lat, lng);
  res.json({ rooms });
});

// GET /api/rooms/vibes
router.get('/vibes', authenticate, async (_req: Request, res: Response) => {
  res.json({ vibes: ROOM_VIBES });
});

// POST /api/rooms
router.post('/', authenticate, rateLimit(3600, 5, 'create_room'), async (req: Request, res: Response) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const room = await createRoom({
    creatorId: req.user.userId,
    name: parsed.data.name,
    vibe: parsed.data.vibe,
    isPublic: parsed.data.isPublic,
    circleId: parsed.data.circleId,
    lat: parsed.data.latitude,
    lng: parsed.data.longitude,
  });

  res.status(201).json({ room });
});

// GET /api/rooms/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const room = await getRoomById(req.params.id as string);
  if (!room) {
    res.status(404).json({ error: 'not_found', message: 'Room not found' });
    return;
  }
  res.json({ room });
});

// POST /api/rooms/:id/join
router.post('/:id/join', authenticate, async (req: Request, res: Response) => {
  await joinRoom(req.params.id as string);
  res.json({ success: true });
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', authenticate, async (req: Request, res: Response) => {
  const minutesSpent = req.body.minutesSpent || 0;
  await leaveRoom(req.params.id as string, minutesSpent);
  res.json({ success: true });
});

export default router;
