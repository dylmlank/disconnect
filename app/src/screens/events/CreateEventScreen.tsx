import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useLocation } from '../../hooks/useLocation';
import { EVENT_CATEGORIES } from '../../constants/categories';
import type { EventCategory } from '@disconnect/shared';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

// Quick time presets
function getTimePresets(): { label: string; date: Date }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const presets: { label: string; date: Date }[] = [];

  // Today options
  const today6pm = new Date(today.getTime() + 18 * 60 * 60 * 1000);
  const today8pm = new Date(today.getTime() + 20 * 60 * 60 * 1000);

  if (today6pm > now) presets.push({ label: 'Today 6pm', date: today6pm });
  if (today8pm > now) presets.push({ label: 'Today 8pm', date: today8pm });

  // Tomorrow options
  presets.push({
    label: 'Tomorrow 10am',
    date: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
  });
  presets.push({ label: 'Tomorrow 2pm', date: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000) });
  presets.push({ label: 'Tomorrow 6pm', date: new Date(tomorrow.getTime() + 18 * 60 * 60 * 1000) });

  // This weekend
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  presets.push({ label: 'Sat 10am', date: new Date(saturday.getTime() + 10 * 60 * 60 * 1000) });
  presets.push({ label: 'Sat 2pm', date: new Date(saturday.getTime() + 14 * 60 * 60 * 1000) });

  return presets;
}

export default function CreateEventScreen({ navigation, route }: { navigation: any; route: any }) {
  const prefillTitle: string = route?.params?.prefillTitle ?? '';
  const prefillCategory: EventCategory = route?.params?.prefillCategory ?? '';

  const [title, setTitle] = useState(prefillTitle);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<EventCategory | null>(prefillCategory || null);
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [allAges, setAllAges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const location = useLocation();
  const createEvent = useEventStore((s) => s.createEvent);

  const timePresets = useMemo(() => getTimePresets(), []);

  const canCreate = title.trim() && startsAt && category && !location.loading && !location.error;

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

  const categoryInfo = EVENT_CATEGORIES.find((c) => c.id === category);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        \n {/* Header */}
        <View style={styles.header}>
          \n{' '}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Event</Text>
          <TouchableOpacity
            style={[styles.previewBtn, !canCreate && styles.previewBtnDisabled]}
            onPress={() => canCreate && setShowPreview(true)}
            disabled={!canCreate}
          >
            <Text style={[styles.previewBtnText, !canCreate && styles.previewBtnTextDisabled]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>
        {/* Title */}
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="What's happening?"
          placeholderTextColor="#444"
          maxLength={100}
        />
        {title.length > 0 && <Text style={styles.charCount}>{title.length}/100</Text>}
        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {EVENT_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryChip, category === c.id && styles.categoryChipSelected]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                <Text
                  style={[styles.categoryLabel, category === c.id && styles.categoryLabelSelected]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* When */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>

          {/* Quick time presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timePresets}
          >
            {timePresets.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.timePreset,
                  startsAt?.getTime() === preset.date.getTime() && styles.timePresetSelected,
                ]}
                onPress={() => setStartsAt(preset.date)}
              >
                <Text
                  style={[
                    styles.timePresetText,
                    startsAt?.getTime() === preset.date.getTime() && styles.timePresetTextSelected,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.timePreset, showDatePicker && styles.timePresetSelected]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={showDatePicker ? '#0a0a0a' : '#888'}
              />
              <Text
                style={[styles.timePresetText, showDatePicker && styles.timePresetTextSelected]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom date picker */}
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              value={startsAt ? startsAt.toISOString().slice(0, 16) : ''}
              onChangeText={(val) => {
                const parsed = new Date(val);
                if (!isNaN(parsed.getTime())) setStartsAt(parsed);
              }}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#555"
            />
          ) : (
            showDatePicker &&
            DateTimePicker && (
              <DateTimePicker
                value={startsAt || new Date()}
                mode="datetime"
                minimumDate={new Date()}
                onChange={(_e: any, date: Date | undefined) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setStartsAt(date);
                }}
              />
            )
          )}

          {startsAt && (
            <Text style={styles.selectedTime}>
              {startsAt.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}{' '}
              at {startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          )}
        </View>
        {/* Where */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconField}
              value={address}
              onChangeText={setAddress}
              placeholder="Add address or place name"
              placeholderTextColor="#555"
              maxLength={200}
            />
          </View>
        </View>
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What should people know? (optional)"
            placeholderTextColor="#555"
            maxLength={500}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Ionicons name="people-outline" size={18} color="#555" />
              <Text style={styles.rowLabel}>Max attendees</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Ionicons name="heart-outline" size={18} color="#555" />
              <Text style={styles.rowLabel}>Open to all ages (13+)</Text>
            </View>
            <Switch value={allAges} onValueChange={setAllAges} trackColor={{ true: '#4ade80' }} />
          </View>
        </View>
        {/* Create button */}
        <TouchableOpacity
          style={[styles.createButton, (!canCreate || loading) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!canCreate || loading}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={canCreate && !loading ? '#0a0a0a' : '#555'}
          />
          <Text
            style={[
              styles.createButtonText,
              (!canCreate || loading) && styles.createButtonTextDisabled,
            ]}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={styles.previewBack}>← Back to Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewContent}>
            <View style={styles.previewCard}>
              <View style={styles.previewCategory}>
                <Text style={styles.previewCategoryText}>
                  {categoryInfo?.emoji} {categoryInfo?.label}
                </Text>
              </View>
              <Text style={styles.previewTitle}>{title}</Text>

              <View style={styles.previewMeta}>
                <View style={styles.previewMetaRow}>
                  <Ionicons name="calendar-outline" size={16} color="#888" />
                  <Text style={styles.previewMetaText}>
                    {startsAt?.toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.previewMetaRow}>
                  <Ionicons name="time-outline" size={16} color="#888" />
                  <Text style={styles.previewMetaText}>
                    {startsAt?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.previewMetaRow}>
                  <Ionicons name="people-outline" size={16} color="#888" />
                  <Text style={styles.previewMetaText}>Up to {maxAttendees} people</Text>
                </View>
                {address && (
                  <View style={styles.previewMetaRow}>
                    <Ionicons name="location-outline" size={16} color="#888" />
                    <Text style={styles.previewMetaText}>{address}</Text>
                  </View>
                )}
              </View>

              {description && (
                <View style={styles.previewDescription}>
                  <Text style={styles.previewDescriptionText}>{description}</Text>
                </View>
              )}

              {allAges && (
                <View style={styles.previewAllAges}>
                  <Text style={styles.previewAllAgesText}>Open to all ages (13+)</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewCreateBtn}
              onPress={() => {
                setShowPreview(false);
                handleCreate();
              }}
            >
              <Text style={styles.previewCreateBtnText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  previewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a3a1a',
  },
  previewBtnDisabled: { backgroundColor: '#1a1a1a' },
  previewBtnText: { fontSize: 14, fontWeight: '600', color: '#4ade80' },
  previewBtnTextDisabled: { color: '#444' },

  // Title
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  charCount: {
    fontSize: 12,
    color: '#444',
    textAlign: 'right',
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 16,
  },

  // Sections
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category
  categoryList: { gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  categoryChipSelected: { backgroundColor: '#0a2a0a', borderColor: '#4ade80' },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 14, color: '#888' },
  categoryLabelSelected: { color: '#4ade80', fontWeight: '600' },

  // Time presets
  timePresets: { gap: 8 },
  timePreset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  timePresetSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  timePresetText: { fontSize: 14, color: '#888' },
  timePresetTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  selectedTime: { fontSize: 15, color: '#4ade80', marginTop: 12, fontWeight: '500' },

  // Inputs
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#262626',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  inputIcon: { marginLeft: 14 },
  inputWithIconField: { flex: 1, padding: 14, fontSize: 16, color: '#fff' },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 15, color: '#888' },
  numberInput: {
    width: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },

  // Create button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#4ade80',
    borderRadius: 14,
    padding: 16,
  },
  createButtonDisabled: { backgroundColor: '#1a1a1a' },
  createButtonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  createButtonTextDisabled: { color: '#555' },

  // Preview
  previewContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  previewBack: { fontSize: 16, color: '#4ade80', fontWeight: '600' },
  previewContent: { flex: 1, padding: 20 },
  previewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  previewCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#0a2a0a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  previewCategoryText: { fontSize: 13, color: '#4ade80', fontWeight: '600' },
  previewTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  previewMeta: { gap: 10 },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewMetaText: { fontSize: 14, color: '#888' },
  previewDescription: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  previewDescriptionText: { fontSize: 15, color: '#aaa', lineHeight: 22 },
  previewAllAges: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a2a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewAllAgesText: { fontSize: 12, color: '#60a5fa', fontWeight: '500' },
  previewActions: { padding: 20, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  previewCreateBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  previewCreateBtnText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
