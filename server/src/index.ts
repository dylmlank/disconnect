import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer } from 'http';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './ws/chatHandler';
import { startBeaconExpiryJob } from './jobs/expireBeacons';
import { startChatArchiveJob } from './jobs/archiveChats';
import { startEventReminderJob } from './jobs/sendEventReminders';
import { startReminderJobs } from './jobs/sendReminders';
import { startDailySummaryJob } from './jobs/sendDailySummary';

import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import beaconRoutes from './routes/beacons';
import userRoutes from './routes/users';
import blockRoutes from './routes/blocks';
import activityRoutes from './routes/activity';
import circleRoutes from './routes/circles';
import habitRoutes from './routes/habits';
import checkinRoutes from './routes/checkins';
import challengeRoutes from './routes/challenges';
import focusRoutes from './routes/focus';
import reactionRoutes from './routes/reactions';
import reportRoutes from './routes/reports';
import discoverRoutes from './routes/discover';
import notificationRoutes from './routes/notifications';
import badgeRoutes from './routes/badges';
import vibeRoutes from './routes/vibes';
import recapRoutes from './routes/recap';
import roomRoutes from './routes/rooms';
import feedRoutes from './routes/feed';

const app = express();
const server = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve landing page in production
if (env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../landing')));
}

app.get('/api/health', async (_req, res) => {
  try {
    const { db } = await import('./config/database');
    await db.raw('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString(), db: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/beacons', beaconRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/vibes', vibeRoutes);
app.use('/api/recap', recapRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/feed', feedRoutes);

app.use(errorHandler);

// WebSocket for event chat
setupWebSocket(server);

async function start() {
  await connectRedis();

  // Start background jobs
  startBeaconExpiryJob();
  startChatArchiveJob();
  startEventReminderJob();
  startReminderJobs();
  startDailySummaryJob();

  server.listen(env.PORT, () => {
    console.log(`Disconnect API running on port ${env.PORT}`);
  });
}

// Only auto-start when run directly, not when imported by tests
if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
