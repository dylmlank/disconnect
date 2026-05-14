import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useToastStore } from '../store/toastStore';

export default function AchievementToast() {
  const { current, dismiss } = useToastStore();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (current) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto-dismiss after 3s
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 300 });
        opacity.value = withDelay(
          100,
          withTiming(0, { duration: 200 }, (finished) => {
            if (finished) runOnJS(dismiss)();
          }),
        );
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -120;
      opacity.value = 0;
    }
  }, [current?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.icon}>{current.icon}</Text>
      <Text style={styles.title}>{current.title}</Text>
      {current.subtitle && (
        <Text style={[styles.subtitle, current.color ? { color: current.color } : undefined]}>
          {current.subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: { fontSize: 28 },
  title: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#4ade80' },
});
