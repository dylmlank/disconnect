import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🤩' },
];

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <View style={styles.row}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.value}
          style={[styles.circle, value === m.value && styles.circleSelected]}
          onPress={() => onChange(m.value)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{m.emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: {
    borderColor: '#4ade80',
    backgroundColor: '#0a2a0a',
  },
  emoji: { fontSize: 26 },
});
