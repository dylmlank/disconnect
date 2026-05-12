import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCircleStore } from '../../store/circleStore';

export default function CreateCircleScreen({ navigation }: { navigation: any }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const createCircle = useCircleStore((s) => s.createCircle);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Give your circle a name.');
    setLoading(true);
    try {
      const circleId = await createCircle(name.trim());
      navigation.replace('CircleDetail', { circleId, circleName: name.trim() });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create circle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Circle</Text>
      <Text style={styles.subtitle}>Invite 2-7 friends for accountability. You'll get an invite code to share.</Text>

      <Text style={styles.label}>Circle name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Study squad, Morning crew..."
        placeholderTextColor="#555"
        maxLength={50}
        autoFocus
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Circle'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8, marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
