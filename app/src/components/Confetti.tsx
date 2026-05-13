import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#a78bfa', '#f87171', '#fbbf24'];
const PARTICLE_COUNT = 30;

interface Props {
  visible: boolean;
  message?: string;
  emoji?: string;
  onDone?: () => void;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Confetti({ visible, message, emoji = '🎉', onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(randomBetween(0, width)),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: randomBetween(6, 12),
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(1);

    const animations = particles.map((p) => {
      p.x.setValue(randomBetween(0, width));
      p.y.setValue(randomBetween(-100, -20));
      p.rotation.setValue(0);

      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: height + 50,
          duration: randomBetween(2000, 3500),
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: randomBetween(0, width),
          duration: randomBetween(2000, 3500),
          useNativeDriver: true,
        }),
        Animated.timing(p.rotation, {
          toValue: randomBetween(2, 6),
          duration: randomBetween(2000, 3500),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        onDone?.();
      });
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rotation.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '2160deg'] }) },
              ],
            },
          ]}
        />
      ))}
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  particle: { position: 'absolute' },
  messageContainer: {
    position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  message: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
});
