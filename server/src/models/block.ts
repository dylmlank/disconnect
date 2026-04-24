import { db } from '../config/database';
import { toUserProfile, UserRow } from './user';

export async function createBlock(blockerId: string, blockedId: string): Promise<void> {
  await db('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId }).onConflict(['blocker_id', 'blocked_id']).ignore();
}

export async function removeBlock(blockerId: string, blockedId: string): Promise<void> {
  await db('blocks').where({ blocker_id: blockerId, blocked_id: blockedId }).del();
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const rows = await db('blocks')
    .where('blocker_id', userId)
    .orWhere('blocked_id', userId)
    .select('blocker_id', 'blocked_id');

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.blocker_id === userId) ids.add(row.blocked_id);
    else ids.add(row.blocker_id);
  }
  return Array.from(ids);
}

export async function getBlockedUsers(blockerId: string) {
  const rows: UserRow[] = await db('blocks')
    .join('users', 'blocks.blocked_id', 'users.id')
    .where('blocks.blocker_id', blockerId)
    .select('users.*');

  return rows.map(toUserProfile);
}

export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const row = await db('blocks')
    .where(function () {
      this.where({ blocker_id: userId1, blocked_id: userId2 }).orWhere({
        blocker_id: userId2,
        blocked_id: userId1,
      });
    })
    .first();
  return !!row;
}
