import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Share, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../store/habitStore';
import { useCheckInStore } from '../../store/checkinStore';
import { useCircleStore } from '../../store/circleStore';
import { useFocusStore } from '../../store/focusStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useThemeStore, themes } from '../../store/themeStore';
import { CURATED_HABITS, getTodaysBite } from '@disconnect/shared';
import { hapticTap, hapticSuccess } from '../../utils/haptics';
import ProgressRing from '../../components/ProgressRing';
import StreakBanner from '../../components/StreakBanner';
import api from '../../services/api';

const todaysBite = getTodaysBite();

const VIBE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  thriving:   { emoji: '🌊', label: 'thriving', color: '#4ade80' },
  locked_in:  { emoji: '🎯', label: 'locked in', color: '#60a5fa' },
  meh:        { emoji: '😶', label: 'meh', color: '#888' },
  low_energy: { emoji: '🌧️', label: 'low energy', color: '#a78bfa' },
  struggling: { emoji: '🥀', label: 'struggling', color: '#f87171' },
};

interface LevelInfo {
  xp: number;
  level: number;
  levelName: string;
  emoji: string;
  progressPercent: number;
}

interface CircleActivity {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
}

export default function HubScreen({ navigation }: { navigation: any }) {
  const { habits, todayLogs, fetchHabits, logHabit } = useHabitStore();
  const { today: todayCheckIn, fetchToday } = useCheckInStore();
  const { circles, fetchCircles } = useCircleStore();
  const { activeSessions, fetchActive } = useFocusStore();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [todayVibe, setTodayVibe] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(0);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [streak, setStreak] = useState(0);
  const [circleActivity, setCircleActivity] = useState<CircleActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showGrow, setShowGrow] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      fetchHabits(),
      fetchToday(),
      fetchCircles(),
      fetchActive(),
      api.get('/vibes/today').then(({ data }) => {
        if (data.vibe) setTodayVibe(data.vibe.vibe);
      }).catch(() => {}),
      api.get('/rooms').then(({ data }) => {
        setRoomCount((data.rooms ?? []).length);
      }).catch(() => {}),
      api.get('/users/me/level').then(({ data }) => {
        const l = data.level;
        if (l?.current) {
          setLevelInfo({
            xp: l.xp,
            level: l.current.level,
            levelName: l.current.name,
            emoji: l.current.emoji,
            progressPercent: l.progressPercent,
          });
        }
      }).catch(() => {}),
      api.get('/users/me/stats').then(({ data }) => {
        setStreak(data.stats?.weeklyStreak ?? 0);
      }).catch(() => {}),
      api.get('/activity/circle').then(({ data }) => {
        setCircleActivity((data.activities ?? []).slice(0, 3));
      }).catch(() => setCircleActivity([])),
    ]);
  }, [fetchHabits, fetchToday, fetchCircles, fetchActive]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const completedHabits = todayLogs.length;
  const totalHabits = habits.length || 1;
  const habitProgress = completedHabits / totalHabits;
  const moodEmojis: Record<number, string> = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickLog = async (habitId: string) => {
    hapticTap();
    await logHabit(habitId);
    hapticSuccess();
    showToast({ icon: '✅', title: 'Habit logged!', subtitle: '+10 XP', color: '#4ade80' });
  };

  // Calculate today's completion score
  const dailyTasks = [
    { done: completedHabits >= totalHabits && habits.length > 0, label: 'Habits' },
    { done: !!todayCheckIn, label: 'Check-in' },
    { done: !!todayVibe, label: 'Vibe' },
  ];
  const dailyScore = dailyTasks.filter((t) => t.done).length;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {greeting()}{user ? `, ${user.firstName}` : ''}
          </Text>
          {levelInfo && (
            <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>
              {levelInfo.emoji} Lv.{levelInfo.level} · {levelInfo.xp} XP
            </Text>
          )}
        </View>
        {levelInfo && (
          <ProgressRing size={44} strokeWidth={3} progress={levelInfo.progressPercent / 100} color={colors.accent}>
            <Text style={[styles.levelNum, { color: colors.accent }]}>{levelInfo.level}</Text>
          </ProgressRing>
        )}
      </View>

      {streak > 0 && <StreakBanner streak={streak} />}

      {/* ── Daily Progress Bar ──────────────────────────── */}
      <View style={[styles.dailyProgress, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.dailyProgressHeader}>
          <Text style={[styles.dailyProgressTitle, { color: colors.text }]}>Today</Text>
          <Text style={[styles.dailyProgressScore, { color: colors.accent }]}>
            {dailyScore}/3 complete
          </Text>
        </View>

        {/* Quick action row — the 3 key daily actions */}
        <View style={styles.dailyActions}>
          <TouchableOpacity
            style={[styles.dailyAction, todayVibe && styles.dailyActionDone]}
            onPress={() => { hapticTap(); navigation.navigate('VibeCheck'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.dailyActionEmoji}>{todayVibe ? (VIBE_MAP[todayVibe]?.emoji ?? '✨') : '✨'}</Text>
            <Text style={[styles.dailyActionLabel, { color: todayVibe ? colors.accent : colors.textMuted }]}>
              {todayVibe ? VIBE_MAP[todayVibe]?.label : 'Set vibe'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dailyAction, todayCheckIn && styles.dailyActionDone]}
            onPress={() => { hapticTap(); navigation.navigate('CheckIn'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.dailyActionEmoji}>{todayCheckIn ? moodEmojis[todayCheckIn.mood] : '💚'}</Text>
            <Text style={[styles.dailyActionLabel, { color: todayCheckIn ? colors.accent : colors.textMuted }]}>
              {todayCheckIn ? 'Done' : 'Check in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dailyAction, (completedHabits >= totalHabits && habits.length > 0) && styles.dailyActionDone]}
            onPress={() => { hapticTap(); navigation.navigate('Habits'); }}
            activeOpacity={0.7}
          >
            <ProgressRing size={28} strokeWidth={2.5} progress={habitProgress} color={colors.accent}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent }}>{completedHabits}</Text>
            </ProgressRing>
            <Text style={[styles.dailyActionLabel, { color: completedHabits >= totalHabits && habits.length > 0 ? colors.accent : colors.textMuted }]}>
              Habits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick-log habit dots */}
        {habits.length > 0 && completedHabits < totalHabits && (
          <View style={[styles.habitDots, { borderTopColor: colors.cardBorder }]}>
            {habits.map((h) => {
              const logged = todayLogs.some((l) => l.habitId === h.habitId);
              const def = CURATED_HABITS.find((c) => c.id === h.habitId);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitDot, { backgroundColor: colors.inputBg }, logged && { backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent }]}
                  onPress={() => !logged && handleQuickLog(h.habitId)}
                  disabled={logged}
                >
                  <Text style={styles.habitEmoji}>{def?.emoji || '⭐'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Focus (highlighted if active) ──────────────── */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => { hapticTap(); navigation.navigate('Focus'); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: mode === 'dark' ? '#0a1a3a' : '#dbeafe' }]}>
            <Ionicons name={activeSessions.length > 0 ? 'timer' : 'timer-outline'} size={22} color="#60a5fa" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Focus</Text>
            <Text style={[styles.cardSub, { color: activeSessions.length > 0 ? '#60a5fa' : colors.textMuted }]}>
              {activeSessions.length > 0
                ? `${activeSessions.length} ${activeSessions.length === 1 ? 'person' : 'people'} focusing now`
                : 'Start a focus session'}
            </Text>
          </View>
          {activeSessions.length > 0 && <View style={styles.liveDot} />}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* ── Connect ──────────────────────────────────────── */}
      <Text style={[styles.groupTitle, { color: colors.textMuted }]}>Connect</Text>

      {/* Circle Activity (compact) */}
      {circleActivity.length > 0 && (
        <View style={[styles.activityCard, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
          {circleActivity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <Text style={[styles.activityDot, { color: colors.accent }]}>•</Text>
              <Text style={[styles.activityText, { color: colors.textSecondary }]}>
                <Text style={[styles.activityName, { color: colors.text }]}>{item.userName}</Text> {item.action}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardPair}>
        <TouchableOpacity
          style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => { hapticTap(); navigation.getParent()?.navigate('SocialTab'); }}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={24} color={colors.accent} />
          <Text style={[styles.halfCardTitle, { color: colors.text }]}>Circles</Text>
          {circles.length > 0 && (
            <Text style={[styles.halfCardBadge, { color: colors.accent }]}>{circles.length} active</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => { hapticTap(); navigation.getParent()?.navigate('SocialTab', { screen: 'Discover' }); }}
          activeOpacity={0.7}
        >
          <Ionicons name="compass-outline" size={24} color="#f59e0b" />
          <Text style={[styles.halfCardTitle, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.halfCardBadge, { color: colors.textMuted }]}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* ── Grow (collapsible) ───────────────────────────── */}
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={() => { hapticTap(); setShowGrow(!showGrow); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.groupTitle, { color: colors.textMuted, marginBottom: 0 }]}>Grow</Text>
        <Ionicons name={showGrow ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {showGrow && (
        <View style={styles.growSection}>
          <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { hapticTap(); navigation.navigate('Challenges'); }} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBubble, { backgroundColor: mode === 'dark' ? '#2a1a0a' : '#fef3c7' }]}>
                <Ionicons name="trophy-outline" size={22} color="#f59e0b" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Challenges</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Join or create a challenge</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { hapticTap(); navigation.navigate('StudyRooms'); }} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBubble, { backgroundColor: mode === 'dark' ? '#0a1a1a' : '#ccfbf1' }]}>
                <Ionicons name="book-outline" size={22} color="#2dd4bf" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Study Rooms</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  {roomCount > 0 ? `${roomCount} active` : 'Focus with others'}
                </Text>
              </View>
              {roomCount > 0 && <View style={styles.liveDot} />}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { hapticTap(); navigation.navigate('WalkTalk'); }} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBubble, { backgroundColor: mode === 'dark' ? '#1a1a0a' : '#fef9c3' }]}>
                <Ionicons name="walk-outline" size={22} color="#f59e0b" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Walk & Talk</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Walk together</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { hapticTap(); navigation.navigate('PhotoFeed'); }} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBubble, { backgroundColor: mode === 'dark' ? '#1a0a2a' : '#ede9fe' }]}>
                <Ionicons name="images-outline" size={22} color="#a78bfa" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Photos</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Proof shots</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Science Bite ─────────────────────────────────── */}
      <View style={[styles.scienceBite, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
        <Text style={styles.scienceEmoji}>{todaysBite.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scienceFact, { color: colors.textSecondary }]}>{todaysBite.fact}</Text>
          <View style={styles.scienceFooter}>
            <Text style={[styles.scienceCitation, { color: colors.textMuted }]}>— {todaysBite.citation}</Text>
            <TouchableOpacity
              onPress={() => Share.share({ message: `${todaysBite.fact} (${todaysBite.citation}) — via Disconnect` })}
              style={styles.scienceShare}
            >
              <Ionicons name="share-outline" size={13} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  levelLabel: { fontSize: 13, fontWeight: '500' },
  levelNum: { fontSize: 14, fontWeight: '800' },

  // Daily Progress
  dailyProgress: {
    borderRadius: 16, padding: 16, marginBottom: 12, marginTop: 8,
    borderWidth: 1,
  },
  dailyProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dailyProgressTitle: { fontSize: 16, fontWeight: '700' },
  dailyProgressScore: { fontSize: 13, fontWeight: '600' },

  dailyActions: { flexDirection: 'row', justifyContent: 'space-around', gap: 12 },
  dailyAction: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dailyActionDone: { backgroundColor: 'rgba(74, 222, 128, 0.06)' },
  dailyActionEmoji: { fontSize: 22 },
  dailyActionLabel: { fontSize: 11, fontWeight: '600' },

  // Habit dots
  habitDots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  habitDot: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  habitEmoji: { fontSize: 16 },

  // Cards
  card: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  iconBubble: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },

  // Card pair (side-by-side)
  cardPair: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  halfCard: {
    flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1,
  },
  halfCardTitle: { fontSize: 14, fontWeight: '700' },
  halfCardBadge: { fontSize: 12, fontWeight: '500' },

  // Group titles
  groupTitle: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 10, marginTop: 14,
  },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, marginTop: 6,
  },
  growSection: {},

  // Circle Activity
  activityCard: {
    borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1,
  },
  activityRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  activityDot: { fontSize: 14 },
  activityText: { fontSize: 13, flex: 1 },
  activityName: { fontWeight: '600' },

  // Science bite
  scienceBite: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12,
    borderWidth: 1, marginTop: 16,
  },
  scienceEmoji: { fontSize: 20 },
  scienceFact: { fontSize: 12, lineHeight: 18 },
  scienceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  scienceCitation: { fontSize: 10, fontStyle: 'italic', flex: 1 },
  scienceShare: { padding: 4 },
});
