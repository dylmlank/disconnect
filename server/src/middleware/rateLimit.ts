import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

export function rateLimit(windowSeconds: number, maxRequests: number, prefix: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const key = `rl:${prefix}:${req.user?.userId || req.ip}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > maxRequests) {
      res.status(429).json({ error: 'rate_limited', message: 'Too many requests' });
      return;
    }

    next();
  };
}
