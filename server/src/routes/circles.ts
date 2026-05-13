import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireAdult } from '../middleware/ageGate';
import { rateLimit } from '../middleware/rateLimit';
import {
  createCircle,
  joinCircle,
  leaveCircle,
  removeMember,
  getUserCircles,
  getCircleDetail,
  getCircleFeed,
} from '../models/circle';
import { getCircleMessages, sendCircleMessage } from '../models/circleMessage';

const router = Router();

const createCircleSchema = z.object({
  name: z.string().min(1).max(50),
});

const joinCircleSchema = z.object({
  inviteCode: z.string().length(8),
});

// GET /api/circles
router.get('/', authenticate, async (req: Request, res: Response) => {
  const circles = await getUserCircles(req.user.userId);
  res.json({ circles });
});

// POST /api/circles
router.post('/', authenticate, requireAdult, rateLimit(3600, 5, 'create_circle'), async (req: Request, res: Response) => {
  const parsed = createCircleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const result = await createCircle(req.user.userId, parsed.data.name);
  if ('error' in result) {
    res.status(429).json(result);
    return;
  }

  res.status(201).json(result);
});

// GET /api/circles/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const detail = await getCircleDetail(req.params.id as string, req.user.userId);
  if (!detail) {
    res.status(404).json({ error: 'not_found', message: 'Circle not found or you are not a member' });
    return;
  }

  res.json({ circle: detail });
});

// POST /api/circles/:id/join
router.post('/:id/join', authenticate, rateLimit(60, 10, 'join_circle'), async (req: Request, res: Response) => {
  const parsed = joinCircleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const result = await joinCircle(req.user.userId, parsed.data.inviteCode);
  if ('error' in result) {
    const status = result.error === 'not_found' ? 404 : result.error === 'full' ? 409 : result.error === 'already_member' ? 409 : 429;
    res.status(status).json(result);
    return;
  }

  res.json(result);
});

// DELETE /api/circles/:id/leave
router.delete('/:id/leave', authenticate, async (req: Request, res: Response) => {
  const left = await leaveCircle(req.user.userId, req.params.id as string);
  if (!left) {
    res.status(404).json({ error: 'not_found', message: 'Circle not found' });
    return;
  }
  res.json({ success: true });
});

// DELETE /api/circles/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req: Request, res: Response) => {
  const result = await removeMember(req.user.userId, req.params.id as string, req.params.userId as string);
  if ('error' in result) {
    const status = result.error === 'not_found' ? 404 : 403;
    res.status(status).json(result);
    return;
  }
  res.json({ success: true });
});

// GET /api/circles/:id/feed
router.get('/:id/feed', authenticate, async (req: Request, res: Response) => {
  const feed = await getCircleFeed(req.params.id as string, req.user.userId, req.query.since as string | undefined);
  if (feed === null) {
    res.status(404).json({ error: 'not_found', message: 'Circle not found or you are not a member' });
    return;
  }
  res.json({ activity: feed });
});

const messageSchema = z.object({
  message: z.string().min(1).max(500),
});

// GET /api/circles/:id/messages
router.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  // Membership check is implicit — getCircleMessages will return empty for non-members via the join check
  const detail = await getCircleDetail(req.params.id as string, req.user.userId);
  if (!detail) {
    res.status(404).json({ error: 'not_found', message: 'Circle not found or you are not a member' });
    return;
  }

  const messages = await getCircleMessages(req.params.id as string, {
    before: req.query.before as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });
  res.json({ messages });
});

// POST /api/circles/:id/messages
router.post('/:id/messages', authenticate, rateLimit(60, 30, 'circle_msg'), async (req: Request, res: Response) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', message: parsed.error.issues[0].message });
    return;
  }

  const detail = await getCircleDetail(req.params.id as string, req.user.userId);
  if (!detail) {
    res.status(404).json({ error: 'not_found', message: 'Circle not found or you are not a member' });
    return;
  }

  const msg = await sendCircleMessage(req.params.id as string, req.user.userId, parsed.data.message);
  res.status(201).json({ message: msg });
});

export default router;
