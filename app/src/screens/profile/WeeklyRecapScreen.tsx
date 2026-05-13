import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Recap {
  name: string;
  weekStarting: string;
  habitsLogged: number;
  habitDays: number;
  focusMinutes: number;
  focusSessions: number;
  eventsAttended: number;
  activeChallenges: number;
  vibes: { vibe: string; date: string }[];
  longestStreak: number;
}

const VIBE_EMOJI: Record<string, string> = {
  thriving: '🌊', locked_in: '🎯', meh: '😶', low_energy: '🌧️', struggling: '🥀',
};

export default function WeeklyRecapScreen() {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recap/weekly')
      .then(({ data }) => setRecap(data.recap))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!recap) return;
    const focusHours = Math.floor(recap.focusMinutes / 60);
    const focusMins = recap.focusMinutes % 60;
    const focusStr = focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`;

    await Share.share({
      message: `My Disconnect week:\n\n` +
        `🌿 ${recap.habitsLogged} habits logged\n` +
        `🎯 ${focusStr} focused\n` +
        `📅 ${recap.eventsAttended} events\n` +
        `🔥 ${recap.longestStreak} day streak\n\n` +
        `Disconnect — less screen, more life\nhttps://disconnect.app`,
    });
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4ade80" /></View>;
  }

  if (!recap) {
    return <View style={styles.center}><Text style={styles.error}>Could not load recap</Text></View>;
  }

  const focusHours = Math.floor(recap.focusMinutes / 60);
  const focusMins = recap.focusMinutes % 60;

  return (
    <View style={styles.container}>
      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>your week</Text>
        <Text style={styles.cardName}>{recap.name}</Text>

        {/* Vibe dots */}
        {recap.vibes.length > 0 && (
          <View style={styles.vibeRow}>
            {recap.vibes.map((v, i) => (
              <Text key={i} style={styles.vibeEmoji}>{VIBE_EMOJI[v.vibe] || '·'}</Text>
            ))}
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recap.habitsLogged}</Text>
            <Text style={styles.statLabel}>habits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#60a5fa' }]}>
              {focusHours > 0 ? `${focusHours}h` : `${focusMins}m`}
            </Text>
            <Text style={styles.statLabel}>focused</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recap.eventsAttended}</Text>
            <Text style={styles.statLabel}>events</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {recap.longestStreak}
            </Text>
            <Text style={styles.statLabel}>streak</Text>
          </View>
        </View>

        {/* Habit days bar */}
        <View style={styles.daysRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.dayCol}>
              <View style={[styles.dayDot, i < recap.habitDays && styles.dayDotFilled]} />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Branding */}
        <View style={styles.branding}>
          <Text style={styles.brandText}>disconnect</Text>
          <Text style={styles.brandSub}>less screen, more life</Text>
        </View>
      </View>

      {/* Share button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="#0a0a0a" />
        <Text style={styles.shareText}>Share to Story</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  error: { color: '#888' },
  card: {
    backgroundColor: '#111', borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#262626',
  },
  cardTitle: { fontSize: 14, color: '#666', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '600' },
  cardName: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 16 },
  vibeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  vibeEmoji: { fontSize: 24 },
  statsGrid: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 24 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '800', color: '#4ade80' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  daysRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#262626' },
  dayDotFilled: { backgroundColor: '#4ade80' },
  dayLabel: { fontSize: 10, color: '#555' },
  branding: { alignItems: 'center', marginTop: 8 },
  brandText: { fontSize: 14, fontWeight: '800', color: '#333', letterSpacing: 2 },
  brandSub: { fontSize: 10, color: '#2a2a2a', marginTop: 2 },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4ade80', borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  shareText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
