import { db } from '../config/database';

export interface CircleMessage {
  id: string;
  circleId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string | null;
  message: string;
  sentAt: string;
}

export async function getCircleMessages(circleId: string, options?: { before?: string; limit?: number }): Promise<CircleMessage[]> {
  let query = db('circle_messages')
    .join('users', 'circle_messages.sender_id', 'users.id')
    .where('circle_messages.circle_id', circleId)
    .select(
      'circle_messages.id',
      'circle_messages.circle_id',
      'circle_messages.sender_id',
      'users.first_name as sender_name',
      'users.photo_url as sender_photo_url',
      'circle_messages.message',
      'circle_messages.sent_at',
    )
    .orderBy('circle_messages.sent_at', 'desc')
    .limit(options?.limit || 50);

  if (options?.before) {
    query = query.where('circle_messages.sent_at', '<', options.before);
  }

  const rows = await query;
  return rows.reverse().map((r: any) => ({
    id: r.id,
    circleId: r.circle_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderPhotoUrl: r.sender_photo_url,
    message: r.message,
    sentAt: r.sent_at.toISOString(),
  }));
}

export async function sendCircleMessage(circleId: string, senderId: string, message: string): Promise<CircleMessage> {
  const [row] = await db('circle_messages')
    .insert({
      circle_id: circleId,
      sender_id: senderId,
      message,
    })
    .returning('*');

  const sender = await db('users').where('id', senderId).select('first_name', 'photo_url').first();

  return {
    id: row.id,
    circleId: row.circle_id,
    senderId: row.sender_id,
    senderName: sender?.first_name || 'Unknown',
    senderPhotoUrl: sender?.photo_url || null,
    message: row.message,
    sentAt: row.sent_at.toISOString(),
  };
}
