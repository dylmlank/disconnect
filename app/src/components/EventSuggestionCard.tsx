import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/themeStore';
import { hapticTap } from '../utils/haptics';
import api from '../services/api';

interface EventSuggestion {
  challengeId: string;
  challengeTitle: string;
  participantCount: number;
  category: string;
  emoji: string;
  suggestedActivity: string;
}

interface Props {
  lat: number;
  lng: number;
  onCreateEvent: (title: string, category: string) => void;
}

export default function EventSuggestionCard({ lat, lng, onCreateEvent }: Props) {
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const colors = useColors();

  useEffect(() => {
    if (!lat || !lng) return;
    api
      .get('/suggestions/events', { params: { lat, lng } })
      .then(({ data }) => setSuggestions(data.suggestions))
      .catch(() => {});
  }, [lat, lng]);

  const visible = suggestions.filter((s) => !dismissed.has(s.challengeId));
  if (visible.length === 0) return null;

  const dismiss = (challengeId: string) => {
    hapticTap();
    setDismissed((prev) => new Set(prev).add(challengeId));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={13} color={colors.accent} />
          <Text style={[styles.headerLabel, { color: colors.textMuted }]}>
            CHALLENGE MEETUPS
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {visible.map((s) => (
          <View
            key={s.challengeId}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            {/* Dismiss */}
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => dismiss(s.challengeId)}
              hitSlop={10}
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Emoji + title */}
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={[styles.question, { color: colors.text }]} numberOfLines={2}>
              Group{' '}
              <Text style={{ color: colors.accent }}>{s.challengeTitle}</Text>
              {' '}meetup?
            </Text>

            {/* Participant count */}
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {s.participantCount} people in your area
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.accentBg, borderColor: colors.accent }]}
              activeOpacity={0.75}
              onPress={() => {
                hapticTap();
                onCreateEvent(
                  `${s.suggestedActivity}: ${s.challengeTitle}`,
                  'outdoors',
                );
              }}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={[styles.createBtnText, { color: colors.accent }]}>
                Create Event
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  dismissBtn: { position: 'absolute', top: 10, right: 10 },
  emoji: { fontSize: 26 },
  question: { fontSize: 14, fontWeight: '700', lineHeight: 20, paddingRight: 16 },
  meta: { fontSize: 12 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  createBtnText: { fontSize: 13, fontWeight: '700' },
});
