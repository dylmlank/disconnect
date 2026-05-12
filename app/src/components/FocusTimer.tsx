import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface FocusTimerProps {
  timeLeft: number; // seconds
  isRunning?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer({ timeLeft, isRunning = false }: FocusTimerProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRunning) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      pulse.setValue(1);
    }

    return () => {
      animRef.current?.stop();
    };
  }, [isRunning]);

  return (
    <View style={styles.container}>
      {/* Pulsing dot */}
      <Animated.View style={[styles.dot, { transform: [{ scale: pulse }], opacity: isRunning ? 1 : 0.3 }]} />
      <Text style={styles.time}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
  },
  time: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
});
