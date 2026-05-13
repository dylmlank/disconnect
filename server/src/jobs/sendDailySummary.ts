import cron from 'node-cron';
import { db } from '../config/database';
import { sendPushToUser } from '../services/push';

// Runs at 9pm every day — sends a daily wins summary to users who were active today
export function startDailySummaryJob() {
  cron.schedule('0 21 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Find users who logged at least 1 habit today
      const activeUsers = await db('habit_logs')
        .where('logged_date', today)
        .distinct('user_id')
        .select('user_id');

      for (const { user_id } of activeUsers) {
        // Count today's activities
        const habitsLogged = Number((await db('habit_logs').where({ user_id, logged_date: today }).count('* as c').first())?.c || 0);
        const focusCompleted = await db('focus_sessions').where({ user_id, completed: true }).whereRaw("DATE(started_at) = ?", [today]).count('* as c').first();
        const focusMin = Number(focusCompleted?.c || 0) > 0
          ? Number((await db('focus_sessions').where({ user_id, completed: true }).whereRaw("DATE(started_at) = ?", [today]).sum('duration_minutes as total').first())?.total || 0)
          : 0;
        const checkedIn = await db('check_ins').where({ user_id, check_in_date: today }).first();

        // Build summary message
        const parts: string[] = [];
        if (habitsLogged > 0) parts.push(`${habitsLogged} habit${habitsLogged > 1 ? 's' : ''} logged`);
        if (focusMin > 0) parts.push(`${focusMin}min focused`);
        if (checkedIn) parts.push('checked in');

        if (parts.length === 0) continue;

        const body = `Today: ${parts.join(', ')}. Nice work! 🌟`;

        await sendPushToUser(user_id, {
          title: 'Daily Wins',
          body,
          data: { type: 'daily_summary' },
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Daily summary job error:', err);
    }
  });

  console.log('Daily summary job scheduled (9pm)');
}
