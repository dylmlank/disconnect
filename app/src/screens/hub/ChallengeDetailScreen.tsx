import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChallengeStore } from '../../store/challengeStore';
import type { ChallengeDayLog, ChallengeParticipantProgress } from '@disconnect/shared';

const CATEGORY_EMOJI: Record<string, string> = {
  phone_free: '📵',
  walk: '🚶',
  deep_work: '🎯',
  digital_sunset: '🌅',
  gratitude: '🙏',
  custom: '⭐',
};

function DayCell({ day, log, today }: { day: number; log: ChallengeDayLog | undefined; today: boolean }) {
  let bg = '#1a1a1a';
  let icon: React.ReactNode = <Text style={styles.dayCellNum}>{day}</Text>;

  if (log?.completed) {
    bg = '#4ade80';
    icon = <Ionicons name="checkmark" size={14} color="#0a0a0a" />;
  } else if (log && !log.completed) {
    bg = '#3f2020';
    icon = <Ionicons name="close" size={14} color="#ff5555" />;
  }

  return (
    <View style={[styles.dayCell, { backgroundColor: bg }, today && styles.dayCellToday]}>
      {icon}
    </View>
  );
}

function ParticipantRow({ p }: { p: ChallengeParticipantProgress }) {
  const pct = p.totalDays > 0 ? Math.round((p.completedDays / p.totalDays) * 100) : 0;
  return (
    <View style={styles.participantRow}>
      <View style={styles.participantAvatar}>
        <Text style={styles.participantInitial}>{p.firstName[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{p.firstName}</Text>
        <View style={styles.participantTrack}>
          <View style={[styles.participantFill, { width: `${pct}%` as any }]} />
        </View>
      </View>
      <Text style={styles.participantPct}>{pct}%</Text>
    </View>
  );
}

export default function ChallengeDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { challengeId } = route.params as { challengeId: string };
  const { currentChallenge, isLoading, fetchChallenge, joinChallenge, logDay } = useChallengeStore();

  useEffect(() => {
    fetchChallenge(challengeId);
  }, [challengeId]);

  if (isLoading || !currentChallenge || currentChallenge.id !== challengeId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const c = currentChallenge;
  const emoji = CATEGORY_EMOJI[c.category] ?? '⭐';

  const startsAt = new Date(c.startsAt);
  const now = new Date();
  const dayNumber = Math.floor((now.getTime() - startsAt.getTime()) / 86400000) + 1;
  const isActive = dayNumber >= 1 && dayNumber <= c.durationDays;

  const todayLog = c.myProgress.find((l) => l.dayNumber === dayNumber);
  const todayLogged = !!todayLog;

  async function handleJoin() {
    try {
      await joinChallenge(c.id);
      await fetchChallenge(c.id);
    } catch {
      Alert.alert('Error', 'Could not join challenge. Try again.');
    }
  }

  async function handleLogToday() {
    if (!isActive) return;
    if (todayLogged) {
      Alert.alert('Already logged', 'You already logged today for this challenge.');
      return;
    }
    Alert.alert('Log Today', `Mark day ${dayNumber} as complete?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete ✓',
        onPress: async () => {
          await logDay(c.id, dayNumber, true);
          await fetchChallenge(c.id);
        },
      },
    ]);
  }

  const logMap = new Map(c.myProgress.map((l) => [l.dayNumber, l]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>{emoji}</Text>
        <Text style={styles.heroTitle}>{c.title}</Text>
        {c.description ? <Text style={styles.heroDesc}>{c.description}</Text> : null}
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaVal}>{c.durationDays}</Text>
            <Text style={styles.heroMetaLabel}>days</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaVal}>{c.participantCount}</Text>
            <Text style={styles.heroMetaLabel}>joined</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Text style={[styles.heroMetaVal, { color: '#f59e0b' }]}>
              {isActive ? `Day ${dayNumber}` : new Date(c.startsAt) > now ? 'Upcoming' : 'Ended'}
            </Text>
            <Text style={styles.heroMetaLabel}>status</Text>
          </View>
        </View>
      </View>

      {/* Daily requirement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Task</Text>
        <View style={styles.requirementBox}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#4ade80" />
          <Text style={styles.requirementText}>{c.dailyRequirement}</Text>
        </View>
      </View>

      {/* Research note */}
      {c.researchNote ? (
        <View style={styles.section}>
          <View style={styles.researchBox}>
            <Text style={styles.researchIcon}>🔬</Text>
            <Text style={styles.researchText}>{c.researchNote}</Text>
          </View>
        </View>
      ) : null}

      {/* Join / Log buttons */}
      {!c.isJoined ? (
        <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
          <Text style={styles.joinBtnText}>Join Challenge</Text>
        </TouchableOpacity>
      ) : isActive ? (
        <TouchableOpacity
          style={[styles.logBtn, todayLogged && styles.logBtnDone]}
          onPress={handleLogToday}
          disabled={todayLogged}
        >
          <Ionicons name={todayLogged ? 'checkmark-circle' : 'add-circle-outline'} size={20} color="#0a0a0a" />
          <Text style={styles.logBtnText}>{todayLogged ? `Day ${dayNumber} Done ✓` : `Log Day ${dayNumber}`}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Progress grid */}
      {c.isJoined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.grid}>
            {Array.from({ length: c.durationDays }, (_, i) => i + 1).map((day) => (
              <DayCell
                key={day}
                day={day}
                log={logMap.get(day)}
                today={day === dayNumber && isActive}
              />
            ))}
          </View>
        </View>
      )}

      {/* Certificate button — show when joined */}
      {c.isJoined && (
        <TouchableOpacity
          style={styles.certBtn}
          onPress={() => navigation.navigate('ChallengeCertificate', { challengeId: c.id })}
        >
          <Ionicons name="ribbon-outline" size={18} color="#f59e0b" />
          <Text style={styles.certBtnText}>
            {c.myProgress.every((d) => d.completed) ? 'View Certificate 🎉' : 'View Progress Card'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Participants */}
      {c.participants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({c.participants.length})</Text>
          {c.participants.map((p) => (
            <ParticipantRow key={p.userId} p={p} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  heroCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  heroMeta: { flexDirection: 'row', gap: 24 },
  heroMetaItem: { alignItems: 'center' },
  heroMetaVal: { fontSize: 18, fontWeight: '700', color: '#fff' },
  heroMetaLabel: { fontSize: 11, color: '#555', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  requirementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  requirementText: { flex: 1, fontSize: 14, color: '#fff', lineHeight: 20 },

  researchBox: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  researchIcon: { fontSize: 18 },
  researchText: { flex: 1, fontSize: 13, color: '#888', lineHeight: 18, fontStyle: 'italic' },

  joinBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  logBtnDone: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#4ade80' },
  logBtnText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },

  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a0a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3a3a0a',
  },
  certBtnText: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  dayCellToday: { borderColor: '#f59e0b', borderWidth: 2 },
  dayCellNum: { fontSize: 12, color: '#555', fontWeight: '600' },

  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: { fontSize: 15, fontWeight: '700', color: '#fff' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 14, color: '#fff', marginBottom: 6, fontWeight: '600' },
  participantTrack: { height: 4, backgroundColor: '#262626', borderRadius: 2, overflow: 'hidden' },
  participantFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 2 },
  participantPct: { fontSize: 13, fontWeight: '700', color: '#f59e0b', width: 40, textAlign: 'right' },
});
