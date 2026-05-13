import { db } from '../config/database';

export type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'safety' | 'other';
export type ReportTargetType = 'user' | 'event' | 'beacon' | 'chat_message';

export async function createReport(data: {
  reporterId: string;
  reportedUserId?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  const [row] = await db('reports')
    .insert({
      reporter_id: data.reporterId,
      reported_user_id: data.reportedUserId || null,
      target_type: data.targetType,
      target_id: data.targetId,
      reason: data.reason,
      details: data.details || null,
    })
    .returning('*');

  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getPendingReports() {
  return db('reports')
    .where('status', 'pending')
    .orderBy('created_at', 'asc')
    .select('*');
}
