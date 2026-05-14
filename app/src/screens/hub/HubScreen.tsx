import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../store/habitStore';
import { useCheckInStore } from '../../store/checkinStore';
import { useCircleStore } from '../../store/circleStore';
import { useFocusStore } from '../../store/focusStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { CURATED_HABITS, getTodaysBite } from '@disconnect/shared';
import ProgressRing from '../../components/ProgressRing';
import StreakBanner from '../../components/StreakBanner';
import QuickActions from '../../components/QuickActions';
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
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [todayVibe, setTodayVibe] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(0);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [streak, setStreak] = useState(0);
  const [circleActivity, setCircleActivity] = useState<CircleActivity[]>([]);

  useEffect(() => {
    Promise.all([
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
        setCircleActivity((data.activities ?? []).slice(0, 5));
      }).catch(() => setCircleActivity([])),
    ]).finally(() => setLoading(false));
  }, []);

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

  const quickActions = [
    { id: 'focus', icon: 'timer-outline' as const, label: 'Focus', color: '#60a5fa', bg: '#0a1a3a', onPress: () => navigation.navigate('Focus') },
    { id: 'habit', icon: 'leaf-outline' as const, label: 'Log Habit', color: '#4ade80', bg: '#0a2a0a', onPress: () => navigation.navigate('Habits') },
    { id: 'checkin', icon: 'heart-outline' as const, label: 'Check In', color: '#f472b6', bg: '#2a0a1a', onPress: () => navigation.navigate('CheckIn') },
    { id: 'beacon', icon: 'radio-outline' as const, label: 'Beacon', color: '#f59e0b', bg: '#2a1a0a', onPress: () => navigation.getParent()?.navigate('BeaconsTab', { screen: 'CreateBeacon' }) },
    { id: 'event', icon: 'calendar-outline' as const, label: 'Events', color: '#a78bfa', bg: '#1a0a2a', onPress: () => navigation.getParent()?.navigate('EventsTab') },
  ];

  const handleQuickLog = async (habitId: string) => {
    await logHabit(habitId);
    showToast({ icon: '✅', title: 'Habit logged!', subtitle: '+10 XP', color: '#4ade80' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      {/* ── Hero Section ─────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <Text style={styles.greeting}>{greeting()}{user ? `, ${user.firstName}` : ''}</Text>
            {levelInfo && (
              <Text style={styles.levelLabel}>
                {levelInfo.emoji} Lv.{levelInfo.level} · {levelInfo.xp} XP
              </Text>
            )}
          </View>
          {levelInfo && (
            <ProgressRing
              size={48}
              strokeWidth={3}
              progress={levelInfo.progressPercent / 100}
              color="#4ade80"
            >
              <Text style={styles.levelNum}>{levelInfo.level}</Text>
            </ProgressRing>
          )}
        </View>

        {/* Streak */}
        {streak > 0 && <StreakBanner streak={streak} />}

        {/* XP bar */}
        {levelInfo && (
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${levelInfo.progressPercent}%` as any }]} />
          </View>
        )}
      </View>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <View style={styles.quickActionsWrap}>
        <QuickActions actions={quickActions} />
      </View>

      {/* ── Vibe Check ───────────────────────────────────────── */}
      {todayVibe ? (
        <TouchableOpacity style={styles.vibeCompact} onPress={() => navigation.navigate('VibeCheck')}>
          <Text style={styles.vibeCompactEmoji}>{VIBE_MAP[todayVibe]?.emoji ?? '✨'}</Text>
          <Text style={[styles.vibeCompactLabel, { color: VIBE_MAP[todayVibe]?.color }]}>
            {VIBE_MAP[todayVibe]?.label ?? todayVibe}
          </Text>
          <Ionicons name="pencil-outline" size={14} color="#555" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.vibePrompt} onPress={() => navigation.navigate('VibeCheck')} activeOpacity={0.8}>
          <LinearGradient colors={['#1a2a1a', '#0a0a0a']} style={styles.vibeGradient}>
            <Text style={styles.vibePromptEmoji}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vibePromptTitle}>How's today going?</Text>
              <Text style={styles.vibePromptSub}>Set your vibe</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4ade80" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Your Day ─────────────────────────────────────────── */}
      <Text style={styles.groupTitle}>Your Day</Text>

      {/* Habits Card — upgraded with progress ring */}
      <TouchableOpacity
        style={[styles.card, completedHabits === totalHabits && habits.length > 0 && styles.cardCompleted]}
        onPress={() => navigation.navigate('Habits')}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          <ProgressRing size={44} strokeWidth={3} progress={habitProgress} color="#4ade80">
            <Text style={styles.habitCount}>{completedHabits}</Text>
          </ProgressRing>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Habits</Text>
            <Text style={styles.cardSub}>
              {completedHabits === totalHabits && habits.length > 0
                ? 'All done! 🎉'
                : `${completedHabits}/${totalHabits} completed`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
        {/* Quick-log habit dots */}
        {habits.length > 0 && completedHabits < totalHabits && (
          <View style={styles.habitDots}>
            {habits.map((h) => {
              const logged = todayLogs.some((l) => l.habitId === h.habitId);
              const def = CURATED_HABITS.find((c) => c.id === h.habitId);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitDot, logged && styles.habitDotDone]}
                  onPress={() => !logged && handleQuickLog(h.habitId)}
                  disabled={logged}
                >
                  <Text style={styles.habitEmoji}>{def?.emoji || '⭐'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>

      {/* Check-in Card */}
      <TouchableOpacity
        style={[styles.card, todayCheckIn && styles.cardCompleted]}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#2a0a1a' }]}>
            <Ionicons name={todayCheckIn ? 'checkmark-circle' : 'heart-outline'} size={22} color="#f472b6" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Check-in</Text>
            <Text style={styles.cardSub}>
              {todayCheckIn
                ? `${moodEmojis[todayCheckIn.mood]} Done`
                : 'Reflect on your day'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Focus Card — highlighted when people are active */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Focus')}
        activeOpacity={0.8}
      >
        {activeSessions.length > 0 ? (
          <LinearGradient colors={['#0a1a3a', '#0a0a0a']} style={styles.cardGradient}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBubble, { backgroundColor: '#0a1a3a' }]}>
                <Ionicons name="timer" size={22} color="#60a5fa" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Focus</Text>
                <Text style={[styles.cardSub, { color: '#60a5fa' }]}>
                  {activeSessions.length} {activeSessions.length === 1 ? 'person' : 'people'} focusing now
                </Text>
              </View>
              <View style={styles.liveDot} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.cardRow}>
            <View style={[styles.iconBubble, { backgroundColor: '#0a1a2a' }]}>
              <Ionicons name="timer-outline" size={22} color="#60a5fa" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Focus</Text>
              <Text style={styles.cardSub}>Start a focus session</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </View>
        )}
      </TouchableOpacity>

      {/* ── Connect ──────────────────────────────────────────── */}
      <Text style={styles.groupTitle}>Connect</Text>

      {/* Circle Activity */}
      {circleActivity.length > 0 && (
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Circle Activity</Text>
          {circleActivity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <Text style={styles.activityDot}>•</Text>
              <Text style={styles.activityText}>
                <Text style={styles.activityName}>{item.userName}</Text> {item.action}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Circles — navigates to Social tab */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.getParent()?.navigate('SocialTab')} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#0a2a0a' }]}>
            <Ionicons name="people-outline" size={22} color="#4ade80" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Circles</Text>
            <Text style={styles.cardSub}>
              {circles.length > 0 ? `${circles.length} active` : 'Join an accountability group'}
            </Text>
          </View>
          {circles.length > 0 && <Text style={styles.badge}>{circles.length}</Text>}
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Discover — navigates to Social tab */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.getParent()?.navigate('SocialTab', { screen: 'Discover' })} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#1a1a0a' }]}>
            <Ionicons name="compass-outline" size={22} color="#f59e0b" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Discover</Text>
            <Text style={styles.cardSub}>Find people nearby</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* ── Grow ─────────────────────────────────────────────── */}
      <Text style={styles.groupTitle}>Grow</Text>

      {/* Challenges */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Challenges')} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#2a1a0a' }]}>
            <Ionicons name="trophy-outline" size={22} color="#f59e0b" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Challenges</Text>
            <Text style={styles.cardSub}>Join or create a challenge</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Study Rooms */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StudyRooms')} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#0a1a1a' }]}>
            <Ionicons name="book-outline" size={22} color="#2dd4bf" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Study Rooms</Text>
            <Text style={styles.cardSub}>
              {roomCount > 0 ? `${roomCount} active` : 'Focus with people nearby'}
            </Text>
          </View>
          {roomCount > 0 && <View style={styles.liveDot} />}
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Walk & Talk */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WalkTalk')} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#1a1a0a' }]}>
            <Ionicons name="walk-outline" size={22} color="#f59e0b" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Walk & Talk</Text>
            <Text style={styles.cardSub}>Walk together, presence-style</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Photos */}
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PhotoFeed')} activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBubble, { backgroundColor: '#1a0a2a' }]}>
            <Ionicons name="images-outline" size={22} color="#a78bfa" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Photos</Text>
            <Text style={styles.cardSub}>Proof shots from your circles</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#333" />
        </View>
      </TouchableOpacity>

      {/* ── Science Bite ─────────────────────────────────────── */}
      <View style={styles.scienceBite}>
        <Text style={styles.scienceEmoji}>{todaysBite.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scienceFact}>{todaysBite.fact}</Text>
          <View style={styles.scienceFooter}>
            <Text style={styles.scienceCitation}>— {todaysBite.citation}</Text>
            <TouchableOpacity
              onPress={() => Share.share({ message: `${todaysBite.fact} (${todaysBite.citation}) — via Disconnect` })}
              style={styles.scienceShare}
            >
              <Ionicons name="share-outline" size={13} color="#4ade80" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Nudge ────────────────────────────────────────────── */}
      <View style={styles.nudge}>
        <Text style={styles.nudgeText}>Pick something and go. The world is waiting.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  // Hero
  hero: { marginBottom: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroText: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  levelLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  levelNum: { fontSize: 14, fontWeight: '800', color: '#4ade80' },
  xpBar: { height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#4ade80', borderRadius: 2 },

  // Quick Actions
  quickActionsWrap: { marginBottom: 20 },

  // Vibe
  vibeCompact: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#262626',
    alignSelf: 'flex-start', marginBottom: 20,
  },
  vibeCompactEmoji: { fontSize: 16 },
  vibeCompactLabel: { fontSize: 14, fontWeight: '600' },
  vibePrompt: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  vibeGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1a3a1a',
  },
  vibePromptEmoji: { fontSize: 24 },
  vibePromptTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  vibePromptSub: { fontSize: 13, color: '#666', marginTop: 2 },

  // Group titles
  groupTitle: {
    fontSize: 13, fontWeight: '700', color: '#555', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 10, marginTop: 8,
  },

  // Cards
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#222',
  },
  cardCompleted: { borderColor: '#1a3a1a', backgroundColor: '#0d1a0d' },
  cardGradient: { borderRadius: 14, padding: 14, margin: -14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 2 },
  iconBubble: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    fontSize: 12, fontWeight: '700', color: '#4ade80',
    backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },

  // Habits
  habitCount: { fontSize: 13, fontWeight: '700', color: '#4ade80' },
  habitDots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#222' },
  habitDot: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center',
  },
  habitDotDone: { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#4ade80' },
  habitEmoji: { fontSize: 16 },

  // Circle Activity
  activityCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  activityTitle: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  activityRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  activityDot: { color: '#4ade80', fontSize: 14 },
  activityText: { fontSize: 13, color: '#888', flex: 1 },
  activityName: { color: '#ccc', fontWeight: '600' },

  // Science bite
  scienceBite: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1a2a1a', marginTop: 16,
  },
  scienceEmoji: { fontSize: 20 },
  scienceFact: { fontSize: 12, color: '#999', lineHeight: 18 },
  scienceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  scienceCitation: { fontSize: 10, color: '#444', fontStyle: 'italic', flex: 1 },
  scienceShare: { padding: 4 },

  // Nudge
  nudge: { marginTop: 20, alignItems: 'center' },
  nudgeText: { fontSize: 13, color: '#333', fontStyle: 'italic' },
});
