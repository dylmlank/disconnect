import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useThemeStore, themes } from '../store/themeStore';
import { useSessionStore } from '../store/sessionStore';

const DURATION_OPTIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
];

interface StartSessionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StartSessionModal({ visible, onClose }: StartSessionModalProps) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const startSession = useSessionStore((s) => s.startSession);

  const [selectedDuration, setSelectedDuration] = useState(60);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    await startSession(selectedDuration);
    setStarting(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.bg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text }]}>Start a session</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            How long do you want to disconnect?
          </Text>

          <View style={styles.options}>
            {DURATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.minutes}
                style={[
                  styles.option,
                  { backgroundColor: colors.card, borderColor: colors.separator },
                  selectedDuration === opt.minutes && {
                    borderColor: colors.accent,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedDuration(opt.minutes)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    { color: selectedDuration === opt.minutes ? colors.accent : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.reminder}>
            <Text style={[styles.reminderText, { color: colors.textMuted }]}>
              💡 Phone and messages will stay available
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent, opacity: starting ? 0.6 : 1 }]}
            onPress={handleStart}
            disabled={starting}
          >
            <Text style={styles.buttonText}>{starting ? 'Starting...' : 'Begin Session'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reminder: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderText: {
    fontSize: 13,
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
