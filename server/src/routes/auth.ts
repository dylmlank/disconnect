import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyToken } from '../config/clerk';
import { env } from '../config/env';
import { db } from '../config/database';
import { rateLimit } from '../middleware/rateLimit';
import { createUser, toUser } from '../models/user';
import { INTEREST_IDS, MIN_INTERESTS, MAX_INTERESTS } from '@disconnect/shared';

const router = Router();

const MIN_AGE = 13;

const createProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bio: z.string().max(140).optional(),
  interests: z
    .array(z.string().refine((id) => INTEREST_IDS.includes(id)))
    .min(MIN_INTERESTS)
    .max(MAX_INTERESTS),
});

// POST /api/auth/create-profile
// Called once after Clerk sign-up to create the local user profile.
router.post('/create-profile', rateLimit(3600, 5, 'create_profile'), async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing token' });
    return;
  }

  const token = header.slice(7);
  let clerkId: string;

  // Test/dev bypass
  if ((env.NODE_ENV === 'test' && req.headers['x-test-clerk-id']) ||
      (env.NODE_ENV === 'development' && req.headers['x-test-clerk-id'])) {
    clerkId = req.headers['x-test-clerk-id'] as string;
  } else if (env.NODE_ENV === 'development' && token.startsWith('dev:')) {
    clerkId = token.slice(4);
  } else {
    try {
      const payload = await verifyToken(token);
      clerkId = payload.sub;
    } catch {
      res.status(401).json({ error: 'expired_token', message: 'Token expired or invalid' });
      return;
    }
  }

  // Guard against double-registration
  const existing = await db('users').where('clerk_id', clerkId).first();
  if (existing) {
    res.status(409).json({ error: 'already_registered', message: 'Profile already exists' });
    return;
  }

  const parsed = createProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  // Age gate
  const dob = new Date(parsed.data.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  if (age < MIN_AGE) {
    res.status(403).json({
      error: 'age_restricted',
      message: `You must be at least ${MIN_AGE} years old to use Disconnect`,
    });
    return;
  }

  try {
    const user = await createUser({
      clerkId,
      firstName: parsed.data.firstName,
      dateOfBirth: parsed.data.dateOfBirth,
      bio: parsed.data.bio,
      interests: parsed.data.interests,
    });

    res.status(201).json({ user: toUser(user) });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'create_failed', message: 'Failed to create profile' });
  }
});

export default router;
