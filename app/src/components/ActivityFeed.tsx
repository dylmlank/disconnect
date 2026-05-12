import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface ActivityItem {
  id: string;
  type: 'new_event' | 'rsvp' | 'beacon_interest';
  message: string;
  timestamp: string;
  eventId?: string;
  beaconId?: string;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function activityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'new_event': return 'add-circle-outline';
    case 'rsvp': return 'checkmark-circle-outline';
    case 'beacon_interest': return 'radio-outline';
  }
}

function activityColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'new_event': return '#4ade80';
    case 'rsvp': return '#60a5fa';
    case 'beacon_interest': return '#f59e0b';
  }
}

interface Props {
  lat: number;
  lng: number;
  onEventPress?: (eventId: string) => void;
}

export default function ActivityFeed({ lat, lng, onEventPress }: Props) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/activity', { params: { lat, lng } });
        setActivity(data.activity);
      } catch {
        // silently fail — feed is non-critical
      } finally {
        setLoaded(true);
      }
    })();
  }, [lat, lng]);

  if (!loaded || activity.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.headerText}>What's happening</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.items}>
          {activity.slice(0, 8).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => item.eventId && onEventPress?.(item.eventId)}
              disabled={!item.eventId}
            >
              <Ionicons name={activityIcon(item.type) as any} size={16} color={activityColor(item.type)} style={styles.icon} />
              <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  headerText: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  items: {
    backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#262626',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#262626',
  },
  icon: { marginRight: 8 },
  message: { flex: 1, fontSize: 13, color: '#ccc' },
  time: { fontSize: 11, color: '#666', marginLeft: 8 },
});
