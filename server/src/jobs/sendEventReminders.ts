import cron from 'node-cron';
import { db } from '../config/database';
import { sendEventReminder } from '../services/push';

export function startEventReminderJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find events starting within the next hour that haven't been reminded yet
      const events = await db('events')
        .where('starts_at', '>', now.toISOString())
        .where('starts_at', '<=', oneHourFromNow.toISOString())
        .whereNull('reminder_sent_at')
        .select('id');

      for (const event of events) {
        await sendEventReminder(event.id);
        await db('events').where('id', event.id).update({ reminder_sent_at: now });
      }

      if (events.length > 0) {
        console.log(`Sent reminders for ${events.length} events`);
      }
    } catch (err) {
      console.error('Event reminder job failed:', err);
    }
  });

  console.log('Event reminder job scheduled');
}
