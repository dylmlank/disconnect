import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore, themes } from '../store/themeStore';
import { useSessionStore } from '../store/sessionStore';

export function SessionTimer() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const plannedDurationMinutes = useSessionStore((s) => s.plannedDurationMinutes);
  const tick = useSessionStore((s) => s.tick);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, tick]);

  if (!isSessionActive) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const timeString =
    hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const plannedSeconds = plannedDurationMinutes * 60;
  const progress = Math.min(elapsedSeconds / plannedSeconds, 1);
  const isOvertime = elapsedSeconds > plannedSeconds;

  return (
    <View style={styles.container}>
      <Text style={[styles.timeText, { color: isOvertime ? colors.accent : colors.text }]}>
        {timeString}
      </Text>

      {isOvertime && (
        <Text style={[styles.overtimeLabel, { color: colors.accent }]}>
          +{Math.floor((elapsedSeconds - plannedSeconds) / 60)}m over
        </Text>
      )}

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.separator }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: isOvertime ? colors.accent : colors.textMuted,
              width: `${Math.min(progress * 100, 100)}%`,
            },
          ]}
        />
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>
        Goal: {plannedDurationMinutes} minutes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  overtimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    marginTop: 8,
  },
});
