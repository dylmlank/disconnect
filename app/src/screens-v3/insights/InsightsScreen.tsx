import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore, themes } from '../../store/themeStore';

export default function InsightsScreen() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  // TODO: Show real data from store/API
  const stats = {
    hoursThisWeek: 14,
    hoursThisMonth: 52,
    hoursThisYear: 156,
    avgMoodAfterScroll: 2.3,
    avgMoodAfterSession: 4.1,
    mostCommonTrigger: 'bored',
    mostDistractedHour: 22, // 10pm
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          The truth about your screen habits
        </Text>

        {/* The Inventory */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>The Inventory</Text>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.bigNumber, { color: colors.accent }]}>{stats.hoursThisWeek}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>hours on apps this week</Text>
          </View>

          <View style={styles.statRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.separator, flex: 1 },
              ]}
            >
              <Text style={[styles.medNumber, { color: colors.text }]}>{stats.hoursThisMonth}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>this month</Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.separator, flex: 1 },
              ]}
            >
              <Text style={[styles.medNumber, { color: colors.text }]}>{stats.hoursThisYear}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>this year</Text>
            </View>
          </View>
        </View>

        {/* Patterns */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Patterns</Text>

          <View
            style={[
              styles.insightCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.insightText, { color: colors.text }]}>
              You reach for apps most around {stats.mostDistractedHour}:00
            </Text>
            <Text style={[styles.insightDetail, { color: colors.textMuted }]}>
              Usually when feeling "{stats.mostCommonTrigger}"
            </Text>
          </View>

          <View
            style={[
              styles.insightCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.insightText, { color: colors.text }]}>
              Avg mood after scrolling: {stats.avgMoodAfterScroll}/5
            </Text>
            <Text style={[styles.insightDetail, { color: colors.textMuted }]}>
              vs {stats.avgMoodAfterSession}/5 after offline sessions
            </Text>
          </View>
        </View>

        {/* Future Self */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Future Self</Text>

          <View
            style={[
              styles.futureCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.futureLabel, { color: colors.textMuted }]}>
              At this rate, by age 30:
            </Text>
            <Text style={[styles.futureNumber, { color: colors.text }]}>2.4 years</Text>
            <Text style={[styles.futureDetail, { color: colors.textMuted }]}>
              spent on social media
            </Text>
          </View>

          <View
            style={[
              styles.futureCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.futureLabel, { color: colors.textMuted }]}>
              If you practiced 2 hours/day instead:
            </Text>
            <Text style={[styles.futureNumber, { color: colors.accent }]}>5,840 hours</Text>
            <Text style={[styles.futureDetail, { color: colors.textMuted }]}>
              by age 30 — mastery territory
            </Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={[styles.ctaCard, { backgroundColor: colors.accent }]}>
          <Text style={styles.ctaText}>The best time to change was yesterday.</Text>
          <Text style={styles.ctaText}>The second best time is now.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  medNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  insightCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  insightText: {
    fontSize: 15,
    fontWeight: '500',
  },
  insightDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  futureCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  futureLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  futureNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  futureDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  ctaCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
