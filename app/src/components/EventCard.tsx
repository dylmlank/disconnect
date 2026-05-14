import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { EventWithDistance } from '@disconnect/shared';
import { EVENT_CATEGORIES } from '../constants/categories';
import UserAvatar from './UserAvatar';

interface Props {
  event: EventWithDistance;
  onPress: () => void;
}

function relativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (diffHours < 0) return 'Past';
  if (diffHours < 1) return `In ${Math.round(diffHours * 60)} min`;
  if (diffDays === 0) return `Today at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  if (diffDays < 7) return `${date.toLocaleDateString(undefined, { weekday: 'long' })} at ${time}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${time}`;
}

export default function EventCard({ event, onPress }: Props) {
  const category = EVENT_CATEGORIES.find((c) => c.id === event.category);
  const date = new Date(event.startsAt);
  const distanceMiles = (event.distance / 1609.34).toFixed(1);
  const isSoon = date.getTime() - Date.now() < 3600000 && date.getTime() > Date.now();
  const spotsLeft = event.maxAttendees - event.attendeeCount;
  const almostFull = spotsLeft <= 3 && spotsLeft > 0;

  return (
    <TouchableOpacity
      style={[styles.card, isSoon && styles.cardSoon]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category + distance row */}
      <View style={styles.header}>
        <View style={styles.categoryBubble}>
          <Text style={styles.emoji}>{category?.emoji || ''}</Text>
          <Text style={styles.category}>{category?.label || event.category}</Text>
        </View>
        <Text style={styles.distance}>{distanceMiles} mi</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{event.title}</Text>

      {/* Time + Attendees */}
      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Text style={[styles.time, isSoon && styles.timeSoon]}>{relativeDate(date)}</Text>
          {isSoon && <View style={styles.soonDot} />}
        </View>
        <Text style={[styles.attendees, almostFull && styles.attendeesHot]}>
          {almostFull ? `${spotsLeft} spots left` : `${event.attendeeCount}/${event.maxAttendees}`}
        </Text>
      </View>

      {/* Creator row */}
      <View style={styles.bottomRow}>
        <View style={styles.creator}>
          <UserAvatar firstName={event.creator.firstName} photoUrl={event.creator.photoUrl} size={20} />
          <Text style={styles.creatorName}>{event.creator.firstName}</Text>
        </View>
        {event.allAges && (
          <Text style={styles.allAges}>All Ages</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  cardSoon: { borderColor: '#1a2a1a', backgroundColor: '#0d1a0d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  categoryBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  emoji: { fontSize: 14 },
  category: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  distance: { fontSize: 12, color: '#555', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 10, lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 13, color: '#888' },
  timeSoon: { color: '#4ade80', fontWeight: '600' },
  soonDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80',
    shadowColor: '#4ade80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 3,
  },
  attendees: { fontSize: 12, color: '#666' },
  attendeesHot: { color: '#f59e0b', fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creatorName: { fontSize: 12, color: '#666' },
  allAges: {
    fontSize: 11, color: '#4ade80', fontWeight: '600',
    backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
});
