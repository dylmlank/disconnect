import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { createReport, ReportReason, ReportTargetType } from '../models/report';

const router = Router();

const VALID_REASONS: ReportReason[] = ['harassment', 'spam', 'inappropriate', 'safety', 'other'];
const VALID_TARGETS: ReportTargetType[] = ['user', 'event', 'beacon', 'chat_message'];

const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  targetType: z.enum(VALID_TARGETS as [string, ...string[]]),
  targetId: z.string().uuid(),
  reason: z.enum(VALID_REASONS as [string, ...string[]]),
  details: z.string().max(500).optional(),
});

// POST /api/reports
router.post('/', authenticate, rateLimit(3600, 10, 'report'), async (req: Request, res: Response) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const report = await createReport({
    reporterId: req.user.userId,
    reportedUserId: parsed.data.reportedUserId,
    targetType: parsed.data.targetType as ReportTargetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason as ReportReason,
    details: parsed.data.details,
  });

  res.status(201).json({ report });
});

export default router;
