import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore, themes } from '../store/themeStore';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.inputBg,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-made skeleton layouts
export function CardSkeleton() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  return (
    <View style={[skeletonStyles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={skeletonStyles.cardRow}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

export function HubSkeleton() {
  return (
    <View style={skeletonStyles.hubWrap}>
      <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="30%" height={14} style={{ marginBottom: 20 }} />
      <View style={[skeletonStyles.progressCard]}>
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hubWrap: { padding: 20 },
  progressCard: { marginBottom: 12 },
});
