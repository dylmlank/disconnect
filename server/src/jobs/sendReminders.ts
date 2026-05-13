import cron from 'node-cron';
import { getUsersWithHabitReminder, getUsersWithCheckinReminder } from '../models/notificationPrefs';
import { sendPushToUser } from '../services/push';

export function startReminderJobs() {
  // Run every minute, check if anyone has a reminder set for this time
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Habit reminders
    const habitUsers = await getUsersWithHabitReminder(hour, minute);
    for (const userId of habitUsers) {
      await sendPushToUser(userId, {
        title: 'Habit Check',
        body: 'Have you logged your habits today? Open Disconnect and check them off.',
        data: { type: 'habit_reminder' },
      }).catch(() => {});
    }

    // Check-in reminders
    const checkinUsers = await getUsersWithCheckinReminder(hour, minute);
    for (const userId of checkinUsers) {
      await sendPushToUser(userId, {
        title: 'Daily Check-in',
        body: 'Take 60 seconds to reflect. How was today?',
        data: { type: 'checkin_reminder' },
      }).catch(() => {});
    }
  });

  console.log('Reminder jobs scheduled (habit + check-in)');
}
