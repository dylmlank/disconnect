import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from '../../constants/interests';

// DateTimePicker doesn't work on web — load conditionally
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function CreateProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [dobText, setDobText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const createProfile = useAuthStore((s) => s.createProfile);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, id];
    });
  };

  const handleCreate = async () => {
    if (!firstName.trim()) {
      Alert.alert('Name required', 'Please enter your first name.');
      return;
    }
    if (!dob) {
      Alert.alert('Birthday required', 'Please enter your date of birth.');
      return;
    }
    if (selectedInterests.length < MIN_INTERESTS) {
      Alert.alert('Interests required', `Please select at least ${MIN_INTERESTS} interests.`);
      return;
    }

    setLoading(true);
    try {
      await createProfile({
        firstName: firstName.trim(),
        dateOfBirth: dob.toISOString().split('T')[0],
        bio: bio.trim() || undefined,
        interests: selectedInterests,
      });
      // Profile created — authStore.user is now set, RootNavigator will show MainTabs
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create profile.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>{"Keep it simple. You're here to go outside."}</Text>

      <Text style={styles.label}>First name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Your first name"
        placeholderTextColor="#555"
        maxLength={50}
      />

      <Text style={styles.label}>Date of birth</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          style={styles.input}
          value={dobText}
          onChangeText={(text) => {
            setDobText(text);
            const parsed = new Date(text);
            if (!isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
              setDob(parsed);
            } else {
              setDob(null);
            }
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#555"
          maxLength={10}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: dob ? '#fff' : '#555', fontSize: 16 }}>
              {dob ? dob.toLocaleDateString() : 'Tap to select'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && DateTimePicker && (
            <DateTimePicker
              value={dob || new Date(2000, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              minimumDate={new Date(1930, 0, 1)}
              onChange={(_e: any, date: Date | undefined) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setDob(date);
              }}
            />
          )}
        </>
      )}

      <Text style={styles.label}>Bio (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={bio}
        onChangeText={setBio}
        placeholder="A few words about yourself"
        placeholderTextColor="#555"
        maxLength={140}
        multiline
      />
      <Text style={styles.charCount}>{bio.length}/140</Text>

      <Text style={styles.label}>
        Pick {MIN_INTERESTS}-{MAX_INTERESTS} interests
      </Text>
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

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Get Started'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 48 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 32 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  charCount: { fontSize: 12, color: '#555', textAlign: 'right', marginTop: 4 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
  },
  chipSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipText: { fontSize: 14, color: '#ccc' },
  chipTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  button: {
    backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
