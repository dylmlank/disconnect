import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function ScreenTimeNudge({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Hey, you've been here a while.</Text>
        <Text style={styles.message}>
          Pick something and go live your life. That's the whole point.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
    padding: 24, zIndex: 1000,
  },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 20, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: '#4ade80', maxWidth: 320,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: { backgroundColor: '#4ade80', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
