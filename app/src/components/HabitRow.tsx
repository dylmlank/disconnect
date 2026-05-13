import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { UserHabit, HabitLog, HabitStreak } from '@disconnect/shared';
import { hapticSuccess } from '../utils/haptics';

interface HabitRowProps {
  habit: UserHabit;
  todayLog: HabitLog | undefined;
  streak: HabitStreak | undefined;
  onLog: () => void;
  onUnlog: () => void;
}

export default function HabitRow({ habit, todayLog, streak, onLog, onUnlog }: HabitRowProps) {
  const def = habit.definition;
  const isLogged = !!todayLog;
  const displayName = habit.customName || def?.name || habit.habitId;
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{def?.emoji ?? '✅'}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        {def?.researchNote ? (
          <Text style={styles.citation} numberOfLines={2}>
            {def.researchNote}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {currentStreak > 0 && (
          <View style={styles.streak}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{currentStreak}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.logBtn, isLogged && styles.logBtnDone]}
          onPress={() => {
            if (isLogged) {
              onUnlog();
            } else {
              hapticSuccess();
              onLog();
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.logBtnText, isLogged && styles.logBtnTextDone]}>
            {isLogged ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 12,
  },
  emoji: { fontSize: 26, width: 36, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  citation: { fontSize: 11, color: '#666', lineHeight: 15 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakFire: { fontSize: 13 },
  streakCount: { fontSize: 13, fontWeight: '700', color: '#f97316' },
  logBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logBtnDone: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  logBtnText: { fontSize: 18, color: '#444' },
  logBtnTextDone: { color: '#0a0a0a', fontWeight: '700' },
});
