import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useBeaconStore } from '../../store/beaconStore';
import { useLocation } from '../../hooks/useLocation';
import { hapticTap } from '../../utils/haptics';

const QUICK_ACTIVITIES = [
  { emoji: '☕', label: 'Coffee' },
  { emoji: '📚', label: 'Study' },
  { emoji: '🏃', label: 'Run' },
  { emoji: '🏀', label: 'Basketball' },
  { emoji: '🎸', label: 'Music' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '🌳', label: 'Park' },
  { emoji: '🎮', label: 'Games' },
];

export default function CreateBeaconScreen({ navigation }: { navigation: any }) {
  const [message, setMessage] = useState('');
  const [activity, setActivity] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const createBeacon = useBeaconStore((s) => s.createBeacon);

  const handleCreate = async () => {
    if (!message.trim()) return Alert.alert('Message required', "Tell people what you're up to.");
    if (location.loading) return Alert.alert('Hold on', 'Still getting your location...');
    if (location.error) return Alert.alert('Location required', location.error);

    setLoading(true);
    try {
      await createBeacon({
        message: message.trim(),
        activity: activity.trim() || undefined,
        location: { latitude: location.latitude, longitude: location.longitude },
        placeName: placeName.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create beacon.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Drop a Beacon</Text>
      <Text style={styles.subtitle}>Let nearby people know you're here. Expires in 2 hours.</Text>

      <Text style={styles.label}>What are you up to?</Text>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Come hang at the park!"
        placeholderTextColor="#555"
        maxLength={140}
        autoFocus
      />
      <Text style={styles.charCount}>{message.length}/140</Text>

      <Text style={styles.label}>Activity</Text>
      <View style={styles.quickRow}>
        {QUICK_ACTIVITIES.map((qa) => (
          <TouchableOpacity
            key={qa.label}
            style={[styles.quickChip, activity === qa.label && styles.quickChipSelected]}
            onPress={() => { hapticTap(); setActivity(activity === qa.label ? '' : qa.label); }}
          >
            <Text style={styles.quickEmoji}>{qa.emoji}</Text>
            <Text style={[styles.quickLabel, activity === qa.label && styles.quickLabelSelected]}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.inputSmall]}
        value={activity}
        onChangeText={setActivity}
        placeholder="Or type something else..."
        placeholderTextColor="#444"
        maxLength={50}
      />

      <Text style={styles.label}>Place name (optional)</Text>
      <TextInput
        style={styles.input}
        value={placeName}
        onChangeText={setPlaceName}
        placeholder="Central Park, Blue Bottle Coffee..."
        placeholderTextColor="#555"
        maxLength={100}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Dropping...' : 'Drop Beacon'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  inputSmall: { paddingVertical: 12, fontSize: 14, marginTop: 10 },
  charCount: { fontSize: 12, color: '#555', textAlign: 'right', marginTop: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#262626',
  },
  quickChipSelected: { borderColor: '#4ade80', backgroundColor: '#0a2a0a' },
  quickEmoji: { fontSize: 16 },
  quickLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  quickLabelSelected: { color: '#4ade80' },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
