import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UserAvatar from './UserAvatar';
import api from '../services/api';
import { hapticTap } from '../utils/haptics';
import { useColors } from '../store/themeStore';
import type { CircleFeedItem, ReactionSummary } from '@disconnect/shared';

const REACTION_EMOJIS = ['🔥', '👏', '💪', '❤️', '🎉', '⭐'] as const;

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function typeEmoji(type: CircleFeedItem['type']): string {
  switch (type) {
    case 'habit_log': return '✅';
    case 'check_in': return '📝';
    case 'focus_session': return '🎯';
    case 'challenge_log': return '🏆';
  }
}

export default function CircleFeedItemComponent({ item }: { item: CircleFeedItem }) {
  const c = useColors();
  const [reactions, setReactions] = useState<ReactionSummary[]>(item.reactions ?? []);
  const [pending, setPending] = useState<string | null>(null);

  async function handleReaction(emoji: string) {
    if (pending) return;
    hapticTap();
    setPending(emoji);

    const existing = reactions.find((r) => r.emoji === emoji);
    const alreadyReacted = existing?.userReacted ?? false;

    // Optimistic update
    setReactions((prev) => {
      if (alreadyReacted) {
        return prev
          .map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r)
          .filter((r) => r.count > 0);
      }
      if (existing) {
        return prev.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r);
      }
      return [...prev, { emoji, count: 1, userReacted: true }];
    });

    try {
      if (alreadyReacted) {
        await api.delete(`/reactions/${item.targetId}`, {
          data: { targetType: item.type, emoji },
        });
      } else {
        await api.post('/reactions', { targetType: item.type, targetId: item.targetId, emoji });
      }
    } catch {
      // Roll back on error
      setReactions(item.reactions ?? []);
    } finally {
      setPending(null);
    }
  }

  // Reactions that already have counts go first; then show remaining tap buttons
  const activeReactions = reactions.filter((r) => r.count > 0);
  const activeEmojis = new Set(activeReactions.map((r) => r.emoji));
  const inactiveEmojis = REACTION_EMOJIS.filter((e) => !activeEmojis.has(e));

  return (
    <View style={[styles.container, { borderBottomColor: c.cardBorder }]}>
      <UserAvatar firstName={item.userName} photoUrl={item.userPhotoUrl} size={32} />
      <View style={styles.content}>
        <Text style={[styles.text, { color: c.textSecondary }]}>
          <Text style={[styles.name, { color: c.text }]}>{item.userName}</Text>{' '}
          {item.message} {typeEmoji(item.type)}
        </Text>
        <Text style={[styles.time, { color: c.textMuted }]}>{timeAgo(item.timestamp)}</Text>

        {/* Reaction row */}
        <View style={styles.reactionRow}>
          {/* Active reactions (with counts) */}
          {activeReactions.map((r) => (
            <TouchableOpacity
              key={r.emoji}
              onPress={() => handleReaction(r.emoji)}
              style={[
                styles.reactionBubble,
                { backgroundColor: r.userReacted ? c.accentBg : c.inputBg },
                r.userReacted && { borderColor: c.accent, borderWidth: 1 },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={[styles.reactionCount, { color: r.userReacted ? c.accent : c.textMuted }]}>
                {r.count}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Inactive emoji tap buttons */}
          {inactiveEmojis.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleReaction(emoji)}
              style={[styles.reactionBubble, styles.inactiveBubble, { backgroundColor: c.inputBg }]}
              activeOpacity={0.6}
            >
              <Text style={[styles.reactionEmoji, styles.inactiveEmoji]}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 12, borderBottomWidth: 1 },
  content: { flex: 1, marginLeft: 10 },
  text: { fontSize: 14, lineHeight: 20 },
  name: { fontWeight: '700' },
  time: { fontSize: 11, marginTop: 4 },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  inactiveBubble: { opacity: 0.45 },
  reactionEmoji: { fontSize: 14 },
  inactiveEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 11, fontWeight: '600' },
});
