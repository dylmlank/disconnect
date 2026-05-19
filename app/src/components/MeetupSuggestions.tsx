import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from './UserAvatar';
import { useThemeStore, themes } from '../store/themeStore';
import { hapticTap } from '../utils/haptics';
import api from '../services/api';

interface Suggestion {
  userId: string;
  firstName: string;
  photoUrl: string | null;
  reason: string;
  emoji: string;
  circleId: string;
  circleName: string;
}

interface Props {
  onTapUser?: (userId: string) => void;
  onCreateEvent?: (suggestion: Suggestion) => void;
}

export default function MeetupSuggestions({ onTapUser, onCreateEvent }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  useEffect(() => {
    api.get('/suggestions/meetup')
      .then(({ data }) => setSuggestions(data.suggestions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (dismissed || loading || suggestions.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          <Ionicons name="people" size={14} color="#4ade80" /> Meetup Ideas
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={12}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {suggestions.slice(0, 3).map((s) => (
        <TouchableOpacity
          key={s.userId}
          style={styles.suggestion}
          onPress={() => {
            hapticTap();
            onTapUser?.(s.userId);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{s.emoji}</Text>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <UserAvatar firstName={s.firstName} photoUrl={s.photoUrl} size={20} />
              <Text style={[styles.name, { color: colors.text }]}>{s.firstName}</Text>
              <Text style={[styles.circle, { color: colors.textMuted }]}>· {s.circleName}</Text>
            </View>
            <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={2}>
              {s.reason}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.meetBtn}
            onPress={() => {
              hapticTap();
              onCreateEvent?.(s);
            }}
          >
            <Ionicons name="calendar-outline" size={14} color="#4ade80" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '700' },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emoji: { fontSize: 20, width: 28 },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700' },
  circle: { fontSize: 11 },
  reason: { fontSize: 12, lineHeight: 16 },
  meetBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a2a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3a2a',
  },
});
