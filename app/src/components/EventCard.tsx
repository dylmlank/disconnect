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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{category?.emoji || ''}</Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{category?.label || event.category}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.distance}>{distanceMiles} mi</Text>
        </View>
      </View>

      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.footer}>
        <Text style={styles.time}>{relativeDate(date)}</Text>
        <Text style={styles.attendees}>
          {event.attendeeCount}/{event.maxAttendees} going
        </Text>
      </View>

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
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#262626',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emoji: { fontSize: 20, marginRight: 8 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  category: { fontSize: 13, color: '#4ade80', fontWeight: '600' },
  dot: { color: '#555' },
  distance: { fontSize: 13, color: '#888' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 13, color: '#aaa' },
  attendees: { fontSize: 13, color: '#888' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creatorName: { fontSize: 12, color: '#888' },
  allAges: {
    fontSize: 11, color: '#4ade80', fontWeight: '600',
    backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
});
