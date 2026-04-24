import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { findUserById, updateUser, toUser } from '../models/user';
import { uploadPhoto } from '../services/storage';
import { INTEREST_IDS, MIN_INTERESTS, MAX_INTERESTS } from '@disconnect/shared';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  bio: z.string().max(140).optional(),
  interests: z
    .array(z.string().refine((id) => INTEREST_IDS.includes(id)))
    .min(MIN_INTERESTS)
    .max(MAX_INTERESTS)
    .optional(),
});

// GET /api/users/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'not_found', message: 'User not found' });
    return;
  }

  res.json({ user: toUser(user) });
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.firstName) updates.first_name = parsed.data.firstName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.interests) updates.interests = parsed.data.interests;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'validation', message: 'No fields to update' });
    return;
  }

  const user = await updateUser(req.user.userId, updates);
  res.json({ user: toUser(user) });
});

// POST /api/users/me/photo
router.post('/me/photo', authenticate, upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'validation', message: 'No photo provided' });
    return;
  }

  const photoUrl = await uploadPhoto(req.file.buffer, req.file.mimetype);
  await updateUser(req.user.userId, { photo_url: photoUrl });

  res.json({ photoUrl });
});

// PUT /api/users/me/device-token
router.put('/me/device-token', authenticate, async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'validation', message: 'Device token required' });
    return;
  }

  await updateUser(req.user.userId, { device_token: token });
  res.json({ success: true });
});

export default router;
