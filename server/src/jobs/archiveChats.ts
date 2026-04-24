import cron from 'node-cron';
import { deleteExpiredChats } from '../models/chatMessage';

export function startChatArchiveJob() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const deleted = await deleteExpiredChats();
      if (deleted > 0) {
        console.log(`Archived ${deleted} chat messages`);
      }
    } catch (err) {
      console.error('Chat archive job failed:', err);
    }
  });

  console.log('Chat archive job scheduled');
}
