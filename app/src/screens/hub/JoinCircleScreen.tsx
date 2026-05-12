import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCircleStore } from '../../store/circleStore';

export default function JoinCircleScreen({ navigation }: { navigation: any }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const joinCircle = useCircleStore((s) => s.joinCircle);

  const handleJoin = async () => {
    const trimmed = code.trim().toLowerCase();
    if (trimmed.length !== 8) return Alert.alert('Invalid code', 'Invite codes are 8 characters.');
    setLoading(true);
    try {
      await joinCircle(trimmed);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to join circle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Circle</Text>
      <Text style={styles.subtitle}>Enter the 8-character invite code shared by a circle member.</Text>

      <Text style={styles.label}>Invite code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="e.g. a1b2c3d4"
        placeholderTextColor="#555"
        maxLength={8}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleJoin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Circle'}</Text>
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
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 20,
    color: '#fff', borderWidth: 1, borderColor: '#333', letterSpacing: 4,
    textAlign: 'center', fontFamily: 'monospace',
  },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
