import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/clerk';
import { db } from '../config/database';
import { env } from '../config/env';

export interface AuthPayload {
  userId: string;
  isMinor: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);

  // Test bypass: in test env, accept a Postgres UUID directly as the bearer token
  if (env.NODE_ENV === 'test' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(token)) {
    const user = await db('users').where('id', token).first();
    if (!user) {
      res.status(401).json({ error: 'unauthorized', message: 'Test user not found' });
      return;
    }
    req.user = { userId: user.id, isMinor: user.is_minor };
    next();
    return;
  }

  // Dev bypass: accept "dev:<clerk_id>" tokens in development mode
  if (env.NODE_ENV === 'development' && token.startsWith('dev:')) {
    const clerkId = token.slice(4);
    const user = await db('users').where('clerk_id', clerkId).first();
    if (!user) {
      res.status(401).json({ error: 'unauthorized', message: 'Dev user not found' });
      return;
    }
    req.user = { userId: user.id, isMinor: user.is_minor };
    next();
    return;
  }

  try {
    const payload = await verifyToken(token);
    const clerkId = payload.sub;

    const user = await db('users').where('clerk_id', clerkId).first();
    if (!user) {
      res.status(404).json({ error: 'profile_not_found', message: 'No profile found. Complete registration.' });
      return;
    }

    req.user = { userId: user.id, isMinor: user.is_minor };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}
