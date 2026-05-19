import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { hapticTap, hapticSuccess } from '../../utils/haptics';
import api from '../../services/api';

const VIBES = [
  { id: 'thriving', label: 'thriving', emoji: '🌊', color: '#4ade80', bg: '#0a2a0a' },
  { id: 'locked_in', label: 'locked in', emoji: '🎯', color: '#60a5fa', bg: '#0a1a2a' },
  { id: 'meh', label: 'meh', emoji: '😶', color: '#888888', bg: '#1a1a1a' },
  { id: 'low_energy', label: 'low energy', emoji: '🌧️', color: '#a78bfa', bg: '#1a0a2a' },
  { id: 'struggling', label: 'struggling', emoji: '🥀', color: '#f87171', bg: '#2a0a0a' },
];

export default function VibeCheckScreen({ navigation }: { navigation: any }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    // Check if already vibed today
    api.get('/vibes/today').then(({ data }) => {
      if (data.vibe) {
        setSelected(data.vibe.vibe);
        setSubmitted(true);
      }
    }).catch(() => {});
  }, []);

  const handleSelect = async (vibeId: string) => {
    hapticTap();
    setSelected(vibeId);
    setSubmitted(true);

    // Animate
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    hapticSuccess();

    try {
      await api.post('/vibes', { vibe: vibeId });
    } catch {
      // ignore
    }

    // Auto-close after 1.5 seconds
    setTimeout(() => navigation.goBack(), 1500);
  };

  const selectedVibe = VIBES.find((v) => v.id === selected);

  if (submitted && selectedVibe) {
    return (
      <View style={[styles.container, { backgroundColor: selectedVibe.bg }]}>
        <Animated.View style={[styles.confirmCard, { transform: [{ scale }] }]}>
          <Text style={styles.confirmEmoji}>{selectedVibe.emoji}</Text>
          <Text style={[styles.confirmLabel, { color: selectedVibe.color }]}>{selectedVibe.label}</Text>
          <Text style={styles.confirmSubtext}>vibes set for today</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>vibe check</Text>
      <Text style={styles.subtitle}>how's today going?</Text>

      <View style={styles.vibes}>
        {VIBES.map((vibe) => (
          <TouchableOpacity
            key={vibe.id}
            style={[styles.vibeButton, { borderColor: vibe.color }]}
            onPress={() => handleSelect(vibe.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
            <Text style={[styles.vibeLabel, { color: vibe.color }]}>{vibe.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 48 },
  vibes: { width: '100%', gap: 12 },
  vibeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20,
    borderWidth: 1,
  },
  vibeEmoji: { fontSize: 28 },
  vibeLabel: { fontSize: 18, fontWeight: '700' },
  confirmCard: { alignItems: 'center' },
  confirmEmoji: { fontSize: 80, marginBottom: 16 },
  confirmLabel: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  confirmSubtext: { fontSize: 15, color: '#666' },
});
