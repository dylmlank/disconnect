import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusStore } from '../../store/focusStore';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { hapticTap, hapticSuccess, hapticHeavy } from '../../utils/haptics';
import FocusTimer from '../../components/FocusTimer';
import type { FocusSession } from '@disconnect/shared';

type Phase = 'idle' | 'active' | 'complete';

const PRESET_DURATIONS = [
  { label: '25 min', value: 25 },
  { label: '50 min', value: 50 },
  { label: '90 min', value: 90 },
];

export default function FocusScreen() {
  const { activeSession, activeSessions, startSession, completeSession, cancelSession, fetchActive } = useFocusStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [intention, setIntention] = useState('');
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const finalDuration = customDuration ? parseInt(customDuration, 10) || 25 : selectedDuration;

  const { timeLeft, isRunning, start, reset } = useFocusTimer({
    durationMinutes: finalDuration,
    onComplete: handleTimerComplete,
  });

  useEffect(() => {
    fetchActive();
  }, []);

  async function handleTimerComplete() {
    hapticSuccess();
    if (currentSession) {
      try {
        await completeSession(currentSession.id);
      } catch {
        // best effort — session already recorded start time
      }
    }
    setPhase('complete');
  }

  async function handleStart() {
    if (isStarting) return;
    hapticHeavy();
    setIsStarting(true);
    try {
      const session = await startSession(finalDuration, intention || undefined);
      setCurrentSession(session);
      setPhase('active');
      start();
      // Refresh who else is focusing
      fetchActive();
    } catch {
      Alert.alert('Error', 'Could not start session. Try again.');
    } finally {
      setIsStarting(false);
    }
  }

  function handleCancel() {
    Alert.alert(
      'End session?',
      'This will cancel your current focus session.',
      [
        { text: 'Keep focusing', style: 'cancel' },
        {
          text: 'End session',
          style: 'destructive',
          onPress: async () => {
            if (currentSession) {
              try {
                await cancelSession(currentSession.id);
              } catch {
                // best effort
              }
            }
            reset();
            setCurrentSession(null);
            setPhase('idle');
          },
        },
      ],
    );
  }

  function handleDone() {
    reset();
    setCurrentSession(null);
    setIntention('');
    setCustomDuration('');
    setSelectedDuration(25);
    setPhase('idle');
    fetchActive();
  }

  // ── Active phase ──────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <View style={styles.activeContainer}>
        <View style={styles.activeCenterBlock}>
          <FocusTimer timeLeft={timeLeft} isRunning={isRunning} />
          {intention ? (
            <Text style={styles.activeIntention}>{intention}</Text>
          ) : null}
        </View>

        {activeSessions.length > 0 && (
          <View style={styles.coFocusers}>
            <Text style={styles.coFocusersLabel}>Focusing now</Text>
            <View style={styles.avatarRow}>
              {activeSessions.map((s) => (
                <View key={s.id} style={styles.avatarItem}>
                  {s.userPhotoUrl ? (
                    <Image source={{ uri: s.userPhotoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {s.userName?.charAt(0) ?? '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.avatarName}>{s.userName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>End</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Complete phase ────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <View style={styles.completeContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#60a5fa" />
        <Text style={styles.completeTitle}>Session complete</Text>
        <Text style={styles.completeDuration}>
          {currentSession?.durationMinutes ?? finalDuration} minutes logged
        </Text>
        <Text style={styles.completePrompt}>Great work. Now go live.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Idle phase ────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Focus</Text>
      <Text style={styles.subtitle}>Block out the world</Text>

      {/* Duration selector */}
      <Text style={styles.sectionLabel}>Duration</Text>
      <View style={styles.durationRow}>
        {PRESET_DURATIONS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[
              styles.durationBtn,
              selectedDuration === preset.value && !customDuration && styles.durationBtnActive,
            ]}
            onPress={() => {
              setSelectedDuration(preset.value);
              setCustomDuration('');
            }}
          >
            <Text
              style={[
                styles.durationBtnText,
                selectedDuration === preset.value && !customDuration && styles.durationBtnTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.customInput, customDuration ? styles.customInputActive : null]}
        placeholder="Custom (min)"
        placeholderTextColor="#444"
        keyboardType="number-pad"
        value={customDuration}
        onChangeText={setCustomDuration}
        maxLength={3}
      />

      {/* Intention */}
      <Text style={styles.sectionLabel}>Intention <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        style={styles.intentionInput}
        placeholder="What are you focusing on?"
        placeholderTextColor="#444"
        value={intention}
        onChangeText={setIntention}
        maxLength={100}
      />

      {/* Start button */}
      <TouchableOpacity
        style={[styles.startBtn, isStarting && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={isStarting}
      >
        {isStarting ? (
          <ActivityIndicator color="#0a0a0a" />
        ) : (
          <Text style={styles.startBtnText}>Start Focus</Text>
        )}
      </TouchableOpacity>

      {/* Currently focusing */}
      {activeSessions.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={styles.activeSectionLabel}>Focusing now</Text>
          {activeSessions.map((s) => (
            <ActiveSessionRow key={s.id} session={s} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ActiveSessionRow({ session }: { session: FocusSession }) {
  const startedAt = new Date(session.startedAt);
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 60000);
  const remaining = Math.max(0, session.durationMinutes - elapsed);

  return (
    <View style={styles.activeRow}>
      {session.userPhotoUrl ? (
        <Image source={{ uri: session.userPhotoUrl }} style={styles.rowAvatar} />
      ) : (
        <View style={styles.rowAvatarPlaceholder}>
          <Text style={styles.rowAvatarInitial}>{session.userName?.charAt(0) ?? '?'}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{session.userName}</Text>
        {session.intention ? (
          <Text style={styles.rowIntention}>{session.intention}</Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowRemaining}>{remaining}m left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Idle
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  durationBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  durationBtnActive: { backgroundColor: '#60a5fa', borderColor: '#60a5fa' },
  durationBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  durationBtnTextActive: { color: '#0a0a0a' },

  customInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 24,
  },
  customInputActive: { borderColor: '#60a5fa' },

  intentionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 32,
  },

  startBtn: {
    backgroundColor: '#60a5fa',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 36,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#0a0a0a' },

  activeSection: { gap: 10 },
  activeSectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 12,
  },
  rowAvatar: { width: 38, height: 38, borderRadius: 19 },
  rowAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarInitial: { fontSize: 15, fontWeight: '700', color: '#888' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rowIntention: { fontSize: 13, color: '#666', marginTop: 2 },
  rowRight: {},
  rowRemaining: { fontSize: 13, color: '#60a5fa', fontWeight: '600' },

  // Active phase
  activeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 80,
    paddingBottom: 56,
  },
  activeCenterBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  activeIntention: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    maxWidth: '80%',
  },
  coFocusers: { alignItems: 'center', marginBottom: 16 },
  coFocusersLabel: { fontSize: 12, color: '#444', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  avatarRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  avatarItem: { alignItems: 'center', gap: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 14, fontWeight: '700', color: '#888' },
  avatarName: { fontSize: 11, color: '#555' },
  cancelBtn: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelBtnText: { fontSize: 15, color: '#555', fontWeight: '600' },

  // Complete phase
  completeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  completeTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  completeDuration: { fontSize: 16, color: '#60a5fa', fontWeight: '600' },
  completePrompt: { fontSize: 15, color: '#555', marginTop: 8 },
  doneBtn: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
