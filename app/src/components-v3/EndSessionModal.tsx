import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useThemeStore, themes } from '../store/themeStore';
import { useSessionStore } from '../store/sessionStore';

interface EndSessionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EndSessionModal({ visible, onClose }: EndSessionModalProps) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  const endSession = useSessionStore((s) => s.endSession);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const plannedDurationMinutes = useSessionStore((s) => s.plannedDurationMinutes);

  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [ending, setEnding] = useState(false);

  const actualMinutes = Math.floor(elapsedSeconds / 60);
  const completedSession = actualMinutes >= plannedDurationMinutes;

  const handleEnd = async () => {
    setEnding(true);
    await endSession(mood ?? undefined, note || undefined);
    setEnding(false);
    setMood(null);
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.bg }]}
          onPress={(e) => e.stopPropagation()}
        >
          {completedSession ? (
            <>
              <Text style={styles.celebration}>🎉</Text>
              <Text style={[styles.title, { color: colors.text }]}>Session complete!</Text>
              <Text style={[styles.statsText, { color: colors.textMuted }]}>
                You stayed offline for {actualMinutes} minutes
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>End session early?</Text>
              <Text style={[styles.statsText, { color: colors.textMuted }]}>
                {actualMinutes} of {plannedDurationMinutes} minutes
              </Text>
            </>
          )}

          <View style={styles.moodSection}>
            <Text style={[styles.moodLabel, { color: colors.text }]}>How do you feel?</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.moodButton,
                    { backgroundColor: colors.card, borderColor: colors.separator },
                    mood === n && { borderColor: colors.accent, borderWidth: 2 },
                  ]}
                  onPress={() => setMood(n)}
                >
                  <Text
                    style={[styles.moodNumber, { color: mood === n ? colors.accent : colors.text }]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.moodLabels}>
              <Text style={[styles.moodLabelLeft, { color: colors.textMuted }]}>Bad</Text>
              <Text style={[styles.moodLabelRight, { color: colors.textMuted }]}>Great</Text>
            </View>
          </View>

          <TextInput
            style={[
              styles.noteInput,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.separator },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="What did you do? (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent, opacity: ending ? 0.6 : 1 }]}
            onPress={handleEnd}
            disabled={ending}
          >
            <Text style={styles.buttonText}>{ending ? 'Ending...' : 'End Session'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Keep going</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  celebration: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  moodSection: {
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  moodButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  moodNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  moodLabelLeft: {
    fontSize: 12,
  },
  moodLabelRight: {
    fontSize: 12,
  },
  noteInput: {
    height: 60,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 20,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
});
