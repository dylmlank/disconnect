import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore, themes } from '../../store/themeStore';

export default function SettingsScreen() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  // TODO: Get real data from store
  const user = {
    firstName: 'User',
    goals: ['read', 'exercise', 'learn'],
    triggerApps: ['Instagram', 'TikTok', 'YouTube'],
  };

  const GOAL_LABELS: Record<string, string> = {
    read: '📚 Read',
    exercise: '💪 Exercise',
    create: '🎨 Create',
    learn: '🎯 Learn',
    connect: '👥 Connect',
    outside: '🌿 Be outside',
    other: '✨ Other',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Profile</Text>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.separator }]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Name</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{user.firstName}</Text>
            <Text style={[styles.rowChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Your Goals</Text>

          <View
            style={[
              styles.goalsCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            {user.goals.map((goal, i) => (
              <Text key={goal} style={[styles.goalItem, { color: colors.text }]}>
                {GOAL_LABELS[goal] || goal}
              </Text>
            ))}
            <TouchableOpacity>
              <Text style={[styles.editLink, { color: colors.accent }]}>Edit goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trigger Apps Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Trigger Apps</Text>

          <View
            style={[
              styles.appsCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            {user.triggerApps.map((app) => (
              <View key={app} style={styles.appRow}>
                <Text style={[styles.appName, { color: colors.text }]}>{app}</Text>
                <Text style={[styles.appStatus, { color: colors.accent }]}>Tracking</Text>
              </View>
            ))}
            <TouchableOpacity>
              <Text style={[styles.editLink, { color: colors.accent }]}>Manage apps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friction Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Break Friction</Text>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.separator }]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Friction level</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>Moderate</Text>
            <Text style={[styles.rowChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <Text style={[styles.infoTitle, { color: colors.text }]}>Current flow:</Text>
            <Text style={[styles.infoItem, { color: colors.textMuted }]}>
              ✓ Pause — type your reason
            </Text>
            <Text style={[styles.infoItem, { color: colors.textMuted }]}>
              ✓ Mirror — show your stats
            </Text>
            <Text style={[styles.infoItem, { color: colors.textMuted }]}>
              ✓ Countdown — 10 seconds
            </Text>
            <Text style={[styles.infoItem, { color: colors.textMuted }]}>
              ✓ Cost — streak warning
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.separator }]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Weekly summary</Text>
            <Text style={[styles.rowValue, { color: colors.accent }]}>On</Text>
            <Text style={[styles.rowChevron, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.separator }]}
          >
            <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Sign out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.separator, marginTop: 8 },
            ]}
          >
            <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete account</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>Disconnect v3.0.0</Text>
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowValue: {
    fontSize: 14,
    marginRight: 8,
  },
  rowChevron: {
    fontSize: 16,
  },
  goalsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  goalItem: {
    fontSize: 15,
    marginBottom: 8,
  },
  appsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appName: {
    fontSize: 15,
  },
  appStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  infoBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
