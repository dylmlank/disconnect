import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import type { BadgeDefinition } from '@disconnect/shared';

interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  definition: BadgeDefinition;
}

export default function BadgesScreen() {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/badges')
      .then(({ data }) => {
        setBadges(data.badges);
        setNewBadges(data.newBadges);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {newBadges.length > 0 && (
        <View style={styles.newBanner}>
          <Text style={styles.newBannerText}>
            🎉 You earned {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''}!
          </Text>
        </View>
      )}

      {badges.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏅</Text>
          <Text style={styles.emptyTitle}>No badges yet</Text>
          <Text style={styles.emptyText}>
            Keep using Disconnect — attend events, complete challenges, and build streaks to earn badges.
          </Text>
        </View>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(item) => item.badgeId}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const isNew = newBadges.includes(item.badgeId);
            return (
              <View style={[styles.badge, isNew && styles.badgeNew]}>
                <Text style={styles.badgeEmoji}>{item.definition.emoji}</Text>
                <Text style={styles.badgeName}>{item.definition.name}</Text>
                <Text style={styles.badgeDesc}>{item.definition.description}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  newBanner: { backgroundColor: '#0a2a0a', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#4ade80' },
  newBannerText: { fontSize: 14, fontWeight: '700', color: '#4ade80' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555' },
  emptyText: { fontSize: 14, color: '#444', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  grid: { padding: 12 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  badge: {
    width: '31%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#262626',
  },
  badgeNew: { borderColor: '#4ade80', backgroundColor: '#0a2a0a' },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  badgeDesc: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 },
});
