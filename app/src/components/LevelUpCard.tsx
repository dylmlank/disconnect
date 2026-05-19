import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore, themes } from '../store/themeStore';
import { hapticSuccess } from '../utils/haptics';
import type { LevelDefinition } from '@disconnect/shared';

interface Props {
  level: LevelDefinition;
  visible: boolean;
  onDismiss: () => void;
}

export default function LevelUpCard({ level, visible, onDismiss }: Props) {
  const mode = useThemeStore((s) => s.mode);
  const t = themes[mode];

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      hapticSuccess();
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.7, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.accent },
            cardStyle,
          ]}
        >
          <Text style={styles.emoji}>{level.emoji}</Text>

          <Text style={[styles.title, { color: t.text }]}>
            Level {level.level}: {level.name.charAt(0).toUpperCase() + level.name.slice(1)}
          </Text>

          {level.unlocks && (
            <View style={[styles.unlockBadge, { backgroundColor: t.accentBg }]}>
              <Text style={styles.unlockLabel}>UNLOCKED</Text>
              <Text style={[styles.unlockFeature, { color: t.accent }]}>{level.unlocks}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: t.accent }]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Nice!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: {
    fontSize: 72,
    lineHeight: 80,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  unlockBadge: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  unlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
    letterSpacing: 1.5,
  },
  unlockFeature: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
