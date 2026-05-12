import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Challenge } from '@disconnect/shared';

const CATEGORY_EMOJI: Record<string, string> = {
  phone_free: '📵',
  walk: '🚶',
  deep_work: '🎯',
  digital_sunset: '🌅',
  gratitude: '🙏',
  custom: '⭐',
};

interface Props {
  challenge: Challenge;
  onPress?: () => void;
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const emoji = CATEGORY_EMOJI[challenge.category] ?? '⭐';

  const startsAt = new Date(challenge.startsAt);
  const endsAt = new Date(challenge.endsAt);
  const now = new Date();

  const isActive = now >= startsAt && now <= endsAt;
  const isUpcoming = now < startsAt;

  const daysRemaining = isActive
    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86400000))
    : isUpcoming
    ? Math.ceil((startsAt.getTime() - now.getTime()) / 86400000)
    : 0;

  const statusLabel = isUpcoming
    ? `Starts in ${daysRemaining}d`
    : isActive
    ? `${daysRemaining}d left`
    : 'Ended';

  const statusColor = isActive ? '#4ade80' : isUpcoming ? '#f59e0b' : '#555';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>
          <Text style={styles.category}>{challenge.category.replace('_', ' ')}</Text>
        </View>
        <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {challenge.description ? (
        <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>
      ) : null}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{challenge.durationDays}</Text>
          <Text style={styles.metaLabel}>days</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{challenge.participantCount}</Text>
          <Text style={styles.metaLabel}>joined</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={[styles.metaValue, { color: '#f59e0b' }]}>{challenge.isPublic ? 'Public' : 'Circle'}</Text>
          <Text style={styles.metaLabel}>visibility</Text>
        </View>
      </View>

      {/* Progress bar (only for active challenges) */}
      {isActive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(((challenge.durationDays - daysRemaining) / challenge.durationDays) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  emoji: { fontSize: 28 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  category: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  status: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 18 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, height: 24, backgroundColor: '#262626' },
  metaValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  metaLabel: { fontSize: 11, color: '#555', marginTop: 1 },
  progressContainer: { marginTop: 10 },
  progressTrack: {
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
});
