import { db } from '../config/database';

// Push notification service
// Uses Expo's push notification service for simplicity with Expo apps
// In production, you'd use FCM for Android and APNs for iOS directly

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const user = await db('users').where('id', userId).select('device_token').first();
  if (!user?.device_token) return;

  try {
    // Using Expo push notification API
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.device_token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
      }),
    });
  } catch (err) {
    console.error(`Push to ${userId} failed:`, err);
  }
}

export async function sendEventReminder(eventId: string): Promise<void> {
  const event = await db('events').where('id', eventId).first();
  if (!event) return;

  const attendees = await db('event_rsvps').where('event_id', eventId).select('user_id');

  for (const { user_id } of attendees) {
    await sendPushToUser(user_id, {
      title: 'Event starting soon!',
      body: `"${event.title}" starts in 1 hour`,
      data: { type: 'event_reminder', eventId },
    });
  }
}

export async function sendBeaconInterestNotification(
  beaconCreatorId: string,
  interestedUserName: string,
  beaconId: string,
): Promise<void> {
  await sendPushToUser(beaconCreatorId, {
    title: 'Someone is interested!',
    body: `${interestedUserName} is interested in your beacon`,
    data: { type: 'beacon_interest', beaconId },
  });
}

export async function sendChatNotification(
  userId: string,
  senderName: string,
  eventTitle: string,
  eventId: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: eventTitle,
    body: `${senderName} sent a message`,
    data: { type: 'chat_message', eventId },
  });
}
