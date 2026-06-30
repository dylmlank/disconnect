import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore, themes } from '../../store/themeStore';
import { useSessionStore } from '../../store/sessionStore';
import { useBreakStore } from '../../store/breakStore';
import { SessionTimer, StartSessionModal, EndSessionModal } from '../../components-v3';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  // Session state
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const currentStreak = useSessionStore((s) => s.currentStreak);
  const todayMinutes = useSessionStore((s) => s.todayMinutes);
  const todayBreakAttempts = useSessionStore((s) => s.todayBreakAttempts);
  const recentSessions = useSessionStore((s) => s.recentSessions);

  // Load initial data
  const loadTodayStats = useSessionStore((s) => s.loadTodayStats);
  const loadRecentSessions = useSessionStore((s) => s.loadRecentSessions);
  const loadStreak = useSessionStore((s) => s.loadStreak);

  // Modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    loadTodayStats();
    loadRecentSessions();
    loadStreak();
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>Ready to disconnect?</Text>
          {currentStreak > 0 && (
            <Text style={[styles.streakBadge, { color: colors.accent }]}>
              🔥 {currentStreak} day streak
            </Text>
          )}
        </View>

        {/* Session Status Card */}
        <View
          style={[
            styles.sessionCard,
            { backgroundColor: colors.card, borderColor: colors.separator },
          ]}
        >
          {isSessionActive ? (
            <>
              <SessionTimer />
              <View style={{ height: 24 }} />
              <TouchableOpacity
                style={[styles.endButton, { backgroundColor: colors.separator }]}
                onPress={() => setShowEndModal(true)}
              >
                <Text style={[styles.endButtonText, { color: colors.text }]}>End Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.sessionTitle, { color: colors.text }]}>No active session</Text>
              <Text style={[styles.sessionSubtitle, { color: colors.textMuted }]}>
                Start one to begin tracking your offline time
              </Text>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowStartModal(true)}
              >
                <Text style={styles.startButtonText}>Start Session</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Today's Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.separator },
              ]}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatDuration(todayMinutes)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>offline</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.separator },
              ]}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{todayBreakAttempts}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>break attempts</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
            onPress={() => navigation.navigate('Bored')}
          >
            <Text style={styles.actionEmoji}>🎯</Text>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>I'm Bored</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                Get a suggestion for something to do
              </Text>
            </View>
            <Text style={[styles.actionChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Check In</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                How are you feeling right now?
              </Text>
            </View>
            <Text style={[styles.actionChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>

          {/* Test button for break flow */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
            onPress={() => useBreakStore.getState().startBreakFlow('instagram', 'Instagram')}
          >
            <Text style={styles.actionEmoji}>🧪</Text>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Test Break Flow</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                DEV: Trigger the break friction overlay
              </Text>
            </View>
            <Text style={[styles.actionChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sessions</Text>

          {recentSessions.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.card, borderColor: colors.separator },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No sessions yet. Start your first one above!
              </Text>
            </View>
          ) : (
            recentSessions.slice(0, 3).map((session) => (
              <View
                key={session.id}
                style={[
                  styles.sessionRow,
                  { backgroundColor: colors.card, borderColor: colors.separator },
                ]}
              >
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionDuration, { color: colors.text }]}>
                    {formatDuration(session.actualDurationMinutes ?? 0)}
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
                    {new Date(session.startedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                {session.moodAfter && (
                  <Text style={styles.moodEmoji}>
                    {session.moodAfter <= 2
                      ? '😔'
                      : session.moodAfter <= 3
                        ? '😐'
                        : session.moodAfter <= 4
                          ? '🙂'
                          : '😄'}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <StartSessionModal visible={showStartModal} onClose={() => setShowStartModal(false)} />
      <EndSessionModal visible={showEndModal} onClose={() => setShowEndModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  streakBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  startButton: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionChevron: {
    fontSize: 18,
  },
  activitySection: {
    marginBottom: 40,
  },
  emptyState: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDuration: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  moodEmoji: {
    fontSize: 20,
  },
});
