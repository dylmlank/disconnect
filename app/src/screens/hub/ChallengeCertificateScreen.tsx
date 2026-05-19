import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, themes } from '../../store/themeStore';
import { hapticSuccess } from '../../utils/haptics';
import api from '../../services/api';

interface Certificate {
  challengeTitle: string;
  category: string;
  durationDays: number;
  completedDays: number;
  completionRate: number;
  isComplete: boolean;
  completedAt: string | null;
  userName: string;
  totalParticipants: number;
  finishers: number;
  researchNote: string | null;
  dailyRequirement: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  phone_free: '📵',
  walk: '🚶',
  deep_work: '📚',
  digital_sunset: '🌅',
  gratitude: '☀️',
  custom: '🏆',
};

export default function ChallengeCertificateScreen({ route, navigation }: { route: any; navigation: any }) {
  const { challengeId } = route.params;
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  useEffect(() => {
    api.get(`/challenges/${challengeId}/certificate`)
      .then(({ data }) => {
        setCert(data.certificate);
        if (data.certificate.isComplete) hapticSuccess();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [challengeId]);

  const handleShare = () => {
    if (!cert) return;
    const msg = cert.isComplete
      ? `I completed the "${cert.challengeTitle}" challenge on Disconnect! ${cert.durationDays} days of "${cert.dailyRequirement}" — backed by research. 💪`
      : `I'm ${cert.completionRate}% through the "${cert.challengeTitle}" challenge on Disconnect! ${cert.completedDays}/${cert.durationDays} days done.`;
    Share.share({ message: msg });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!cert) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textMuted }}>Could not load certificate</Text>
      </View>
    );
  }

  const emoji = CATEGORY_EMOJI[cert.category] || '🏆';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Certificate Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: cert.isComplete ? '#4ade80' : colors.cardBorder }]}>
        {cert.isComplete && <Text style={styles.completeBadge}>COMPLETED</Text>}

        <Text style={styles.bigEmoji}>{emoji}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{cert.challengeTitle}</Text>
        <Text style={[styles.requirement, { color: colors.textSecondary }]}>
          "{cert.dailyRequirement}"
        </Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{cert.completedDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>days done</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{cert.durationDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>total days</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: cert.completionRate === 100 ? '#4ade80' : colors.text }]}>
              {cert.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>completion</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${cert.completionRate}%` }]} />
        </View>

        {/* Group stats */}
        {cert.totalParticipants > 1 && (
          <Text style={[styles.groupStat, { color: colors.textMuted }]}>
            {cert.finishers} of {cert.totalParticipants} participants finished
          </Text>
        )}

        {/* Research note */}
        {cert.researchNote && (
          <View style={[styles.researchBox, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.researchLabel, { color: colors.textMuted }]}>Why this works:</Text>
            <Text style={[styles.researchNote, { color: colors.textSecondary }]}>
              {cert.researchNote}
            </Text>
          </View>
        )}

        {/* Completion date */}
        {cert.completedAt && (
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        )}

        <Text style={[styles.userName, { color: colors.textMuted }]}>— {cert.userName}</Text>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={18} color="#0a0a0a" />
        <Text style={styles.shareText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: colors.textMuted }]}>Back to Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    gap: 12,
  },
  completeBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#4ade80',
    color: '#0a0a0a',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  bigEmoji: { fontSize: 48, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  requirement: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
  statsGrid: { flexDirection: 'row', gap: 24, marginTop: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#262626',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#4ade80', borderRadius: 3 },
  groupStat: { fontSize: 12, marginTop: 4 },
  researchBox: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  researchLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  researchNote: { fontSize: 13, lineHeight: 18 },
  dateText: { fontSize: 12, marginTop: 4 },
  userName: { fontSize: 13, fontWeight: '600' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  shareText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  backButton: { marginTop: 16, padding: 12 },
  backText: { fontSize: 14 },
});
