import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from '../../constants/interests';
import api from '../../services/api';

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!firstName.trim()) return Alert.alert('Name required');
    if (selectedInterests.length < MIN_INTERESTS) return Alert.alert('Pick more interests');

    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', {
        firstName: firstName.trim(),
        bio: bio.trim(),
        interests: selectedInterests,
      });
      useAuthStore.getState().setUser(data.user);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>First name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} maxLength={50} />

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio} maxLength={140} multiline />

      <Text style={styles.label}>Interests ({selectedInterests.length}/{MAX_INTERESTS})</Text>
      <View style={styles.interests}>
        {INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[styles.chip, selectedInterests.includes(interest.id) && styles.chipSelected]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Text style={[styles.chipText, selectedInterests.includes(interest.id) && styles.chipTextSelected]}>
              {interest.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 48 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
  },
  chipSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipText: { fontSize: 13, color: '#ccc' },
  chipTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
