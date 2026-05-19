import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hapticWarning } from '../utils/haptics';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

function getContextualNudge(): { title: string; message: string; suggestion: string } {
  const hour = new Date().getHours();

  if (hour < 9) {
    return {
      title: "It's early — start right.",
      message: "Your morning is too valuable for scrolling. Put the phone down.",
      suggestion: "☀️ Go outside for 5 minutes before checking anything else.",
    };
  } else if (hour < 12) {
    return {
      title: "You've been here a while.",
      message: "The morning's slipping away. Do one real thing.",
      suggestion: "🚶 Take a walk, grab a coffee, or call someone.",
    };
  } else if (hour < 17) {
    return {
      title: "Hey. Real life is out there.",
      message: "Close this app and do something that matters to you.",
      suggestion: "🎯 Start a focus session on something you've been putting off.",
    };
  } else if (hour < 21) {
    return {
      title: "Evening's here.",
      message: "Screen time after dark isn't doing you any favors.",
      suggestion: "🌳 Go for a walk, cook dinner, or hang out with someone in person.",
    };
  } else {
    return {
      title: "Time to wind down.",
      message: "Screens this late mess up your sleep. You know this.",
      suggestion: "📖 Read a book, stretch, or just sit in quiet for a minute.",
    };
  }
}

export default function ScreenTimeNudge({ visible, onDismiss }: Props) {
  if (!visible) return null;

  const nudge = getContextualNudge();
  hapticWarning();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{nudge.title}</Text>
        <Text style={styles.message}>{nudge.message}</Text>
        <View style={styles.suggestionRow}>
          <Text style={styles.suggestion}>{nudge.suggestion}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Got it, closing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissLink} onPress={onDismiss}>
          <Text style={styles.dismissText}>5 more minutes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center',
    padding: 24, zIndex: 1000,
  },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 20, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: '#4ade80', maxWidth: 340,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  suggestionRow: {
    backgroundColor: '#0a2a0a', borderRadius: 12, padding: 14, width: '100%', marginBottom: 24,
    borderWidth: 1, borderColor: '#1a3a1a',
  },
  suggestion: { fontSize: 14, color: '#4ade80', textAlign: 'center', lineHeight: 20 },
  button: { backgroundColor: '#4ade80', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  dismissLink: { marginTop: 14, padding: 8 },
  dismissText: { fontSize: 13, color: '#555' },
});
