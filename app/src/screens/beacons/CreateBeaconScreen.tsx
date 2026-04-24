import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useBeaconStore } from '../../store/beaconStore';
import { useLocation } from '../../hooks/useLocation';

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
    <View style={styles.container}>
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

      <Text style={styles.label}>Activity (optional)</Text>
      <TextInput
        style={styles.input}
        value={activity}
        onChangeText={setActivity}
        placeholder="Frisbee, coffee, study..."
        placeholderTextColor="#555"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  charCount: { fontSize: 12, color: '#555', textAlign: 'right', marginTop: 4 },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
