import { db } from '../config/database';
import type { ReactionTargetType } from '@disconnect/shared';

export async function addReaction(
  userId: string,
  targetType: ReactionTargetType,
  targetId: string,
  emoji: string,
) {
  const [row] = await db('reactions')
    .insert({ user_id: userId, target_type: targetType, target_id: targetId, emoji })
    .onConflict(['user_id', 'target_type', 'target_id'])
    .merge({ emoji })
    .returning('*');

  return {
    id: row.id,
    userId: row.user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    emoji: row.emoji,
    createdAt: row.created_at.toISOString(),
  };
}

export async function removeReaction(reactionId: string, userId: string): Promise<boolean> {
  const deleted = await db('reactions').where({ id: reactionId, user_id: userId }).del();
  return deleted > 0;
}

export async function getReactionsForTargets(
  targetType: ReactionTargetType,
  targetIds: string[],
  viewerUserId: string,
) {
  if (targetIds.length === 0) return {};

  const rows = await db('reactions')
    .whereIn('target_id', targetIds)
    .where('target_type', targetType)
    .select('*');

  const result: Record<string, { emoji: string; count: number; userReacted: boolean }[]> = {};

  for (const targetId of targetIds) {
    const targetRows = rows.filter((r: any) => r.target_id === targetId);
    const emojiCounts = new Map<string, { count: number; userReacted: boolean }>();

    for (const row of targetRows) {
      const existing = emojiCounts.get(row.emoji) || { count: 0, userReacted: false };
      existing.count++;
      if (row.user_id === viewerUserId) existing.userReacted = true;
      emojiCounts.set(row.emoji, existing);
    }

    result[targetId] = Array.from(emojiCounts.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    }));
  }

  return result;
}
