import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './ws/chatHandler';
import { startBeaconExpiryJob } from './jobs/expireBeacons';
import { startChatArchiveJob } from './jobs/archiveChats';
import { startEventReminderJob } from './jobs/sendEventReminders';

import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import beaconRoutes from './routes/beacons';
import userRoutes from './routes/users';
import blockRoutes from './routes/blocks';
import activityRoutes from './routes/activity';

const app = express();
const server = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/beacons', beaconRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/activity', activityRoutes);

app.use(errorHandler);

// WebSocket for event chat
setupWebSocket(server);

async function start() {
  await connectRedis();

  // Start background jobs
  startBeaconExpiryJob();
  startChatArchiveJob();
  startEventReminderJob();

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
