import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export default function StreakBadge({ count, size = 'medium' }: Props) {
  if (count === 0) return null;

  const fontSize = size === 'small' ? 12 : size === 'large' ? 20 : 14;
  const iconSize = size === 'small' ? 12 : size === 'large' ? 22 : 16;
  const padding = size === 'small' ? 4 : size === 'large' ? 10 : 6;

  // Color intensity based on streak length
  const getColor = () => {
    if (count >= 30) return '#f59e0b'; // gold
    if (count >= 14) return '#fb923c'; // orange
    if (count >= 7) return '#f87171'; // red
    return '#888'; // grey
  };

  const getBgColor = () => {
    if (count >= 30) return '#2a2000';
    if (count >= 14) return '#2a1500';
    if (count >= 7) return '#2a0a0a';
    return '#1a1a1a';
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBgColor(), paddingHorizontal: padding + 4, paddingVertical: padding }]}>
      <Text style={{ fontSize: iconSize }}>🔥</Text>
      <Text style={[styles.count, { fontSize, color: getColor() }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 12,
  },
  count: { fontWeight: '800' },
});
