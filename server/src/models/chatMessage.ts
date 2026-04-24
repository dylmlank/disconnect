import { db } from '../config/database';
import { toUserProfile } from './user';

export async function createChatMessage(data: {
  eventId: string;
  senderId: string;
  message: string;
}) {
  const [row] = await db('event_chat_messages')
    .insert({
      event_id: data.eventId,
      sender_id: data.senderId,
      message: data.message,
    })
    .returning('*');

  const sender = await db('users').where('id', data.senderId).first();

  return {
    id: row.id,
    eventId: row.event_id,
    senderId: row.sender_id,
    message: row.message,
    sentAt: row.sent_at.toISOString(),
    sender: toUserProfile(sender),
  };
}

export async function getChatMessages(eventId: string, options: { before?: string; limit?: number }) {
  const limit = Math.min(options.limit || 50, 100);

  let query = db('event_chat_messages')
    .join('users', 'event_chat_messages.sender_id', 'users.id')
    .where('event_chat_messages.event_id', eventId)
    .select('event_chat_messages.*', 'users.id as user_id', 'users.first_name', 'users.bio', 'users.interests', 'users.photo_url', 'users.is_minor');

  if (options.before) {
    query = query.where('event_chat_messages.sent_at', '<', options.before);
  }

  const rows = await query.orderBy('event_chat_messages.sent_at', 'desc').limit(limit);

  return rows.reverse().map((row) => ({
    id: row.id,
    eventId: row.event_id,
    senderId: row.sender_id,
    message: row.message,
    sentAt: row.sent_at.toISOString(),
    sender: {
      id: row.user_id,
      firstName: row.first_name,
      bio: row.bio,
      interests: row.interests,
      photoUrl: row.photo_url,
      isMinor: row.is_minor,
    },
  }));
}

export async function deleteExpiredChats(): Promise<number> {
  // Delete chat messages for events that ended more than 24 hours ago
  const result = await db('event_chat_messages')
    .whereIn('event_id', function () {
      this.select('id')
        .from('events')
        .where(function () {
          // Events with explicit end time: ended > 24h ago
          this.whereNotNull('ends_at').where('ends_at', '<', new Date(Date.now() - 24 * 60 * 60 * 1000));
        })
        .orWhere(function () {
          // Events without end time: started > 24h ago
          this.whereNull('ends_at').where('starts_at', '<', new Date(Date.now() - 24 * 60 * 60 * 1000));
        });
    })
    .del();

  return result;
}
