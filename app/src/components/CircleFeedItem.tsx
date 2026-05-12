import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import UserAvatar from './UserAvatar';
import type { CircleFeedItem } from '@disconnect/shared';

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function typeEmoji(type: CircleFeedItem['type']): string {
  switch (type) {
    case 'habit_log': return '✅';
    case 'check_in': return '📝';
    case 'focus_session': return '🎯';
    case 'challenge_log': return '🏆';
  }
}

export default function CircleFeedItemComponent({ item }: { item: CircleFeedItem }) {
  return (
    <View style={styles.container}>
      <UserAvatar firstName={item.userName} photoUrl={item.userPhotoUrl} size={32} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.name}>{item.userName}</Text> {item.message} {typeEmoji(item.type)}
        </Text>
        <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#262626' },
  content: { flex: 1, marginLeft: 10 },
  text: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  name: { fontWeight: '700', color: '#fff' },
  time: { fontSize: 11, color: '#666', marginTop: 4 },
});
