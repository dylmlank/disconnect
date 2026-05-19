import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert, Platform,
} from 'react-native';
import { useEventStore } from '../../store/eventStore';
import { useLocation } from '../../hooks/useLocation';
import { EVENT_CATEGORIES } from '../../constants/categories';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function CreateEventScreen({ navigation, route }: { navigation: any; route: any }) {
  const prefillTitle: string = route?.params?.prefillTitle ?? '';
  const prefillCategory: string = route?.params?.prefillCategory ?? '';

  const [title, setTitle] = useState(prefillTitle);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<string | null>(prefillCategory || null);
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [allAges, setAllAges] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const createEvent = useEventStore((s) => s.createEvent);

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Title required');
    if (!startsAt) return Alert.alert('Date required', 'Pick when the event starts.');
    if (!category) return Alert.alert('Category required', 'Pick a category.');
    if (location.loading) return Alert.alert('Hold on', 'Still getting your location...');
    if (location.error) return Alert.alert('Location required', location.error);

    setLoading(true);
    try {
      const eventId = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: { latitude: location.latitude, longitude: location.longitude },
        address: address.trim() || undefined,
        startsAt: startsAt.toISOString(),
        category,
        maxAttendees: parseInt(maxAttendees, 10) || 20,
        allAges,
      });
      navigation.replace('EventDetail', { eventId });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Event</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What are you doing?" placeholderTextColor="#555" maxLength={100} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Tell people what to expect" placeholderTextColor="#555" maxLength={500} multiline />

      <Text style={styles.label}>Where</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address or place name" placeholderTextColor="#555" />

      <Text style={styles.label}>When</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          style={styles.input}
          value={startsAt ? startsAt.toISOString().slice(0, 16) : ''}
          onChangeText={(val) => {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) setStartsAt(parsed);
          }}
          placeholder="YYYY-MM-DDTHH:MM (e.g. 2026-05-01T14:00)"
          placeholderTextColor="#555"
        />
      ) : (
        <>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: startsAt ? '#fff' : '#555', fontSize: 16 }}>
              {startsAt ? startsAt.toLocaleString() : 'Tap to pick date & time'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && DateTimePicker && (
            <DateTimePicker
              value={startsAt || new Date()}
              mode="datetime"
              minimumDate={new Date()}
              onChange={(_e: any, date: Date | undefined) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setStartsAt(date);
              }}
            />
          )}
        </>
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {EVENT_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, category === c.id && styles.chipSelected]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={[styles.chipText, category === c.id && styles.chipTextSelected]}>
              {c.emoji} {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Max attendees</Text>
      <TextInput style={styles.input} value={maxAttendees} onChangeText={setMaxAttendees} keyboardType="number-pad" />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Open to all ages (13+)</Text>
        <Switch value={allAges} onValueChange={setAllAges} trackColor={{ true: '#4ade80' }} />
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Event'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8, marginBottom: 24 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
  },
  chipSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipText: { fontSize: 13, color: '#ccc' },
  chipTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  switchLabel: { fontSize: 15, color: '#fff' },
  button: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
