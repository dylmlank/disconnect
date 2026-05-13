import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

type VibeType = 'thriving' | 'locked_in' | 'meh' | 'low_energy' | 'struggling';

interface VibeEntry {
  vibe: VibeType;
  date: string;
}

const VIBE_META: Record<VibeType, { emoji: string; label: string; color: string }> = {
  thriving:   { emoji: '🌊', label: 'Thriving',   color: '#4ade80' },
  locked_in:  { emoji: '🎯', label: 'Locked In',  color: '#60a5fa' },
  meh:        { emoji: '😶', label: 'Meh',         color: '#888888' },
  low_energy: { emoji: '🌧️', label: 'Low Energy', color: '#a78bfa' },
  struggling: { emoji: '🥀', label: 'Struggling', color: '#f87171' },
};

const ALL_VIBES: VibeType[] = ['thriving', 'locked_in', 'meh', 'low_energy', 'struggling'];

// Build a 30-day array filling gaps with null
function buildDayMap(history: VibeEntry[]): (VibeEntry | null)[] {
  const map: Record<string, VibeType> = {};
  history.forEach((e) => { map[e.date] = e.vibe; });

  const days: (VibeEntry | null)[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push(map[dateStr] ? { vibe: map[dateStr], date: dateStr } : null);
  }
  return days;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MoodTrendsScreen() {
  const [history, setHistory] = useState<VibeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vibes/history', { params: { days: 30 } })
      .then(({ data }) => setHistory(data.history ?? []))
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

  const days = buildDayMap(history);
  const logged = history.length;

  // Stats per vibe
  const counts = Object.fromEntries(ALL_VIBES.map((v) => [v, 0])) as Record<VibeType, number>;
  history.forEach((e) => { counts[e.vibe]++; });

  const mostCommon = ALL_VIBES.reduce<VibeType | null>((best, v) =>
    best === null || counts[v] > counts[best] ? v : best, null);

  // Build week labels: show label at start of each week
  const weekLabels: { index: number; label: string }[] = [];
  days.forEach((d, i) => {
    if (i === 0 || i % 7 === 0) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      weekLabels.push({ index: i, label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }
  });

  const dotSize = Math.floor((width - 56) / 30) - 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.heading}>Mood Trends</Text>
      <Text style={styles.subheading}>Your last 30 days</Text>

      {/* Dot grid */}
      <View style={styles.gridCard}>
        <View style={styles.dotRow}>
          {days.map((entry, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
                entry
                  ? { backgroundColor: VIBE_META[entry.vibe].color }
                  : styles.dotEmpty,
              ]}
            />
          ))}
        </View>

        {/* Week markers */}
        <View style={styles.weekRow}>
          {weekLabels.map(({ label }, idx) => (
            <Text key={idx} style={[styles.weekLabel, { width: `${(7 / 30) * 100}%` as any }]}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{logged}</Text>
          <Text style={styles.summaryLabel}>days tracked</Text>
        </View>
        <View style={styles.summaryDivider} />
        {mostCommon && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{VIBE_META[mostCommon].emoji}</Text>
            <Text style={styles.summaryLabel}>most common</Text>
          </View>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{30 - logged}</Text>
          <Text style={styles.summaryLabel}>days missed</Text>
        </View>
      </View>

      {/* Breakdown */}
      <Text style={styles.sectionTitle}>Breakdown</Text>
      <View style={styles.breakdownCard}>
        {ALL_VIBES.filter((v) => counts[v] > 0).map((v) => {
          const meta = VIBE_META[v];
          const pct = logged > 0 ? Math.round((counts[v] / logged) * 100) : 0;
          const isTop = v === mostCommon;
          return (
            <View key={v} style={[styles.breakdownRow, isTop && styles.breakdownRowHighlight]}>
              <Text style={styles.breakdownEmoji}>{meta.emoji}</Text>
              <View style={styles.breakdownInfo}>
                <View style={styles.breakdownTopRow}>
                  <Text style={styles.breakdownLabel}>{meta.label}</Text>
                  {isTop && (
                    <View style={styles.mostCommonBadge}>
                      <Text style={styles.mostCommonBadgeText}>most common</Text>
                    </View>
                  )}
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: meta.color }]}
                  />
                </View>
              </View>
              <Text style={styles.breakdownCount}>{counts[v]}d</Text>
            </View>
          );
        })}
        {logged === 0 && (
          <Text style={styles.noData}>No vibes logged yet. Set your vibe daily on the Hub!</Text>
        )}
      </View>

      {/* Recent entries */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.recentCard}>
            {[...history].reverse().slice(0, 7).map((entry, i) => {
              const meta = VIBE_META[entry.vibe];
              return (
                <View key={i} style={[styles.recentRow, i > 0 && styles.recentRowBorder]}>
                  <Text style={styles.recentEmoji}>{meta.emoji}</Text>
                  <Text style={styles.recentLabel}>{meta.label}</Text>
                  <Text style={styles.recentDate}>{formatDate(entry.date)}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  heading: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#555', marginBottom: 20 },

  // Dot grid
  gridCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#262626', marginBottom: 12,
  },
  dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  dot: { opacity: 0.9 },
  dotEmpty: { backgroundColor: '#262626' },
  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekLabel: { fontSize: 10, color: '#444', textAlign: 'left' },

  // Summary strip
  summaryStrip: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderWidth: 1, borderColor: '#262626', marginBottom: 20,
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#262626' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // Breakdown
  breakdownCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#262626', gap: 14, marginBottom: 20,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownRowHighlight: {
    backgroundColor: '#111', borderRadius: 12, padding: 8, marginHorizontal: -4,
  },
  breakdownEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  breakdownInfo: { flex: 1, gap: 6 },
  breakdownTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', color: '#ddd' },
  mostCommonBadge: {
    backgroundColor: '#4ade8022', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  mostCommonBadgeText: { fontSize: 10, color: '#4ade80', fontWeight: '700' },
  barTrack: { height: 4, backgroundColor: '#262626', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  breakdownCount: { fontSize: 13, fontWeight: '700', color: '#888', minWidth: 26, textAlign: 'right' },
  noData: { fontSize: 14, color: '#555', textAlign: 'center', paddingVertical: 10 },

  // Recent
  recentCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#262626',
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  recentRowBorder: { borderTopWidth: 1, borderTopColor: '#262626' },
  recentEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  recentLabel: { fontSize: 14, fontWeight: '600', color: '#ddd', flex: 1 },
  recentDate: { fontSize: 13, color: '#555' },
});
