import { Request, Response, NextFunction } from 'express';

export function requireAdult(req: Request, res: Response, next: NextFunction): void {
  if (req.user.isMinor) {
    res.status(403).json({
      error: 'age_restricted',
      message: 'You must be 18 or older to perform this action',
    });
    return;
  }
  next();
}
