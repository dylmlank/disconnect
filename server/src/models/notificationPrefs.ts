import { db } from '../config/database';

export interface NotificationPrefs {
  eventReminders: boolean;
  challengeReminders: boolean;
  circleActivity: boolean;
  beaconInterest: boolean;
  chatMessages: boolean;
  habitReminderTime: string | null;
  checkinReminderTime: string | null;
}

const DEFAULT_PREFS: NotificationPrefs = {
  eventReminders: true,
  challengeReminders: true,
  circleActivity: true,
  beaconInterest: true,
  chatMessages: true,
  habitReminderTime: null,
  checkinReminderTime: null,
};

export async function getPreferences(userId: string): Promise<NotificationPrefs> {
  const row = await db('notification_preferences').where('user_id', userId).first();
  if (!row) return DEFAULT_PREFS;

  return {
    eventReminders: row.event_reminders,
    challengeReminders: row.challenge_reminders,
    circleActivity: row.circle_activity,
    beaconInterest: row.beacon_interest,
    chatMessages: row.chat_messages,
    habitReminderTime: row.habit_reminder_time,
    checkinReminderTime: row.checkin_reminder_time,
  };
}

export async function updatePreferences(
  userId: string,
  prefs: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const updates: Record<string, unknown> = {};
  if (prefs.eventReminders !== undefined) updates.event_reminders = prefs.eventReminders;
  if (prefs.challengeReminders !== undefined) updates.challenge_reminders = prefs.challengeReminders;
  if (prefs.circleActivity !== undefined) updates.circle_activity = prefs.circleActivity;
  if (prefs.beaconInterest !== undefined) updates.beacon_interest = prefs.beaconInterest;
  if (prefs.chatMessages !== undefined) updates.chat_messages = prefs.chatMessages;
  if (prefs.habitReminderTime !== undefined) updates.habit_reminder_time = prefs.habitReminderTime;
  if (prefs.checkinReminderTime !== undefined) updates.checkin_reminder_time = prefs.checkinReminderTime;
  updates.updated_at = db.fn.now();

  const existing = await db('notification_preferences').where('user_id', userId).first();
  if (existing) {
    await db('notification_preferences').where('user_id', userId).update(updates);
  } else {
    await db('notification_preferences').insert({ user_id: userId, ...updates });
  }

  return getPreferences(userId);
}

export async function getUsersWithHabitReminder(hour: number, minute: number): Promise<string[]> {
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const rows = await db('notification_preferences')
    .where('habit_reminder_time', time)
    .select('user_id');
  return rows.map((r: any) => r.user_id);
}

export async function getUsersWithCheckinReminder(hour: number, minute: number): Promise<string[]> {
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const rows = await db('notification_preferences')
    .where('checkin_reminder_time', time)
    .select('user_id');
  return rows.map((r: any) => r.user_id);
}
