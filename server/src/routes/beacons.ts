import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireAdult } from '../middleware/ageGate';
import { rateLimit } from '../middleware/rateLimit';
import {
  findBeaconsNearby,
  createBeacon,
  getActiveBeaconCount,
  addBeaconInterest,
  getBeaconInterests,
  deleteBeacon,
} from '../models/beacon';
import { db } from '../config/database';
import { sendBeaconInterestNotification } from '../services/push';

const router = Router();

const MILES_TO_METERS = 1609.34;
const DEFAULT_RADIUS_MILES = 25;

const listBeaconsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).optional(),
});

const createBeaconSchema = z.object({
  message: z.string().min(1).max(140),
  activity: z.string().max(50).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  placeName: z.string().max(100).optional(),
});

// GET /api/beacons
router.get('/', authenticate, async (req: Request, res: Response) => {
  const parsed = listBeaconsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radius } = parsed.data;
  const radiusMeters = (radius || DEFAULT_RADIUS_MILES) * MILES_TO_METERS;

  const beacons = await findBeaconsNearby({
    lat,
    lng,
    radiusMeters,
    userId: req.user.userId,
  });

  res.json({ beacons });
});

// POST /api/beacons
router.post('/', authenticate, requireAdult, rateLimit(3600, 5, 'create_beacon'), async (req: Request, res: Response) => {
  const parsed = createBeaconSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  // Rate limit: 1 active beacon per user
  const activeCount = await getActiveBeaconCount(req.user.userId);
  if (activeCount >= 1) {
    res.status(429).json({
      error: 'beacon_limit',
      message: 'You can only have 1 active beacon at a time',
    });
    return;
  }

  const beaconId = await createBeacon({
    creatorId: req.user.userId,
    message: parsed.data.message,
    activity: parsed.data.activity,
    lat: parsed.data.location.latitude,
    lng: parsed.data.location.longitude,
    placeName: parsed.data.placeName,
  });

  res.status(201).json({ id: beaconId });
});

// POST /api/beacons/:id/interest
router.post('/:id/interest', authenticate, rateLimit(60, 20, 'beacon_interest'), async (req: Request, res: Response) => {
  const beaconId = req.params.id as string;
  const added = await addBeaconInterest(beaconId, req.user.userId);
  if (!added) {
    res.status(404).json({ error: 'not_found', message: 'Beacon not found or expired' });
    return;
  }

  // Notify beacon creator (fire-and-forget)
  const beacon = await db('beacons').where('id', beaconId).select('creator_id').first();
  const user = await db('users').where('id', req.user.userId).select('first_name').first();
  if (beacon && user) {
    sendBeaconInterestNotification(beacon.creator_id, user.first_name, beaconId).catch(() => {});
  }

  res.json({ success: true });
});

// GET /api/beacons/:id/interests
router.get('/:id/interests', authenticate, async (req: Request, res: Response) => {
  const result = await getBeaconInterests(req.params.id as string);
  res.json(result);
});

// DELETE /api/beacons/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const deleted = await deleteBeacon(req.params.id as string, req.user.userId);
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Beacon not found or not yours' });
    return;
  }

  res.json({ success: true });
});

export default router;
