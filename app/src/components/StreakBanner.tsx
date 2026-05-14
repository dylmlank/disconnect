import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface Props {
  streak: number;
  label?: string;
}

export default function StreakBanner({ streak, label = 'day streak' }: Props) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  if (streak <= 0) return null;

  const fireEmoji = streak >= 30 ? '🌟' : streak >= 14 ? '🔥🔥' : streak >= 7 ? '🔥' : '✨';
  const bgColor = streak >= 14 ? '#2a1a0a' : streak >= 7 ? '#1a1a0a' : '#0a1a0a';
  const borderColor = streak >= 14 ? '#f59e0b' : streak >= 7 ? '#f59e0b' : '#4ade80';
  const textColor = streak >= 14 ? '#f59e0b' : streak >= 7 ? '#f59e0b' : '#4ade80';

  return (
    <Animated.View style={[styles.container, containerStyle, { backgroundColor: bgColor, borderColor }]}>
      <Animated.View style={[styles.glowDot, glowStyle, { backgroundColor: borderColor }]} />
      <Text style={styles.fire}>{fireEmoji}</Text>
      <Text style={[styles.count, { color: textColor }]}>{streak}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  glowDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: -3,
    right: -3,
  },
  fire: { fontSize: 16 },
  count: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, color: '#888', fontWeight: '500' },
});
