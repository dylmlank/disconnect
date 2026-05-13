import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const userId = (req as any).user?.userId ?? 'unauthenticated';
  console.error(`Unhandled error [${req.method} ${req.path}] user=${userId}:`, err);

  res.status(500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
}
