import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useThemeStore, themes } from '../store/themeStore';
import { useBreakStore } from '../store/breakStore';
import { useSessionStore } from '../store/sessionStore';

export function BreakFlowOverlay() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  // Break state
  const isBreakFlowActive = useBreakStore((s) => s.isBreakFlowActive);
  const step = useBreakStore((s) => s.step);
  const appName = useBreakStore((s) => s.appName);
  const typedReason = useBreakStore((s) => s.typedReason);
  const mirrorStat = useBreakStore((s) => s.mirrorStat);
  const streakAtRisk = useBreakStore((s) => s.streakAtRisk);
  const countdownRemaining = useBreakStore((s) => s.countdownRemaining);

  // Actions
  const setTypedReason = useBreakStore((s) => s.setTypedReason);
  const submitPause = useBreakStore((s) => s.submitPause);
  const submitMirror = useBreakStore((s) => s.submitMirror);
  const tickCountdown = useBreakStore((s) => s.tickCountdown);
  const cancelBreak = useBreakStore((s) => s.cancelBreak);
  const completeBreak = useBreakStore((s) => s.completeBreak);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isBreakFlowActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isBreakFlowActive]);

  // Countdown timer
  useEffect(() => {
    if (step === 'countdown' && countdownRemaining > 0) {
      const timer = setTimeout(() => {
        tickCountdown();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdownRemaining, tickCountdown]);

  if (!isBreakFlowActive || !step) return null;

  const renderStep = () => {
    switch (step) {
      case 'pause':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>🛑</Text>
            <Text style={[styles.title, { color: colors.text }]}>Before you open {appName}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              What do you need right now?
            </Text>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.separator },
              ]}
              value={typedReason}
              onChangeText={setTypedReason}
              placeholder="Type your reason..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor:
                    typedReason.trim().length >= 3 ? colors.accent : colors.separator,
                },
              ]}
              onPress={submitPause}
              disabled={typedReason.trim().length < 3}
            >
              <Text
                style={[styles.buttonText, { opacity: typedReason.trim().length >= 3 ? 1 : 0.5 }]}
              >
                Continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={cancelBreak}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Actually, never mind
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'mirror':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>🪞</Text>
            <Text style={[styles.title, { color: colors.text }]}>Just so you know</Text>
            <Text style={[styles.mirrorStat, { color: colors.textMuted }]}>{mirrorStat}</Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={submitMirror}
            >
              <Text style={styles.buttonText}>I understand</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={cancelBreak}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Cancel — stay offline
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'countdown':
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.countdownNumber, { color: colors.accent }]}>
              {countdownRemaining}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Opening {appName} in...</Text>

            {streakAtRisk && (
              <View
                style={[
                  styles.streakWarning,
                  { backgroundColor: colors.card, borderColor: colors.separator },
                ]}
              >
                <Text style={[styles.streakText, { color: colors.text }]}>
                  ⚠️ This will reset your {streakAtRisk}-day streak
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.cancelCountdownButton,
                { backgroundColor: colors.card, borderColor: colors.separator },
              ]}
              onPress={cancelBreak}
            >
              <Text style={[styles.cancelCountdownText, { color: colors.text }]}>
                Cancel — stay offline
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: colors.bg, opacity: fadeAnim }]}>
      {renderStep()}

      {/* Emergency button */}
      <TouchableOpacity style={styles.emergencyButton} onPress={() => completeBreak(true)}>
        <Text style={[styles.emergencyText, { color: colors.textMuted }]}>Emergency bypass →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  mirrorStat: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  input: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: '700',
    marginBottom: 16,
  },
  streakWarning: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelCountdownButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  cancelCountdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 48,
  },
  emergencyText: {
    fontSize: 12,
  },
});
