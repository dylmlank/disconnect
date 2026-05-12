import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useChallengeStore } from '../../store/challengeStore';
import { CHALLENGE_TEMPLATES } from '../../constants/challengeTemplates';
import type { ChallengeCategory, ChallengeTemplate } from '@disconnect/shared';

const CATEGORY_EMOJI: Record<string, string> = {
  phone_free: '📵',
  walk: '🚶',
  deep_work: '🎯',
  digital_sunset: '🌅',
  gratitude: '🙏',
  custom: '⭐',
};

const CATEGORIES: ChallengeCategory[] = ['phone_free', 'walk', 'deep_work', 'digital_sunset', 'gratitude', 'custom'];

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CreateChallengeScreen() {
  const navigation = useNavigation<any>();
  const { createChallenge } = useChallengeStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ChallengeTemplate | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRequirement, setDailyRequirement] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>('custom');
  const [researchNote, setResearchNote] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [startsAt, setStartsAt] = useState(tomorrow());
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function applyTemplate(t: ChallengeTemplate) {
    setSelectedTemplate(t);
    setTitle(t.title);
    setDescription(t.description);
    setDailyRequirement(t.dailyRequirement);
    setCategory(t.category);
    setResearchNote(t.researchNote);
    setDurationDays(String(t.durationDays));
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a challenge title.');
      return;
    }
    if (!dailyRequirement.trim()) {
      Alert.alert('Missing Field', 'Please enter the daily requirement.');
      return;
    }
    const days = parseInt(durationDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Invalid Duration', 'Duration must be between 1 and 365 days.');
      return;
    }

    setSubmitting(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (isPublic) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      }

      const id = await createChallenge({
        title: title.trim(),
        description: description.trim() || null,
        durationDays: days,
        dailyRequirement: dailyRequirement.trim(),
        category,
        researchNote: researchNote.trim() || null,
        startsAt,
        isPublic,
        lat,
        lng,
      });

      navigation.replace('ChallengeDetail', { challengeId: id });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as any).response?.data?.message ?? 'Failed to create challenge')
          : 'Failed to create challenge';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Templates */}
      <Text style={styles.sectionLabel}>Start from a template</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {(CHALLENGE_TEMPLATES as readonly ChallengeTemplate[]).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.templateChip, selectedTemplate?.id === t.id && styles.templateChipSelected]}
            onPress={() => applyTemplate(t)}
          >
            <Text style={styles.templateEmoji}>{CATEGORY_EMOJI[t.category]}</Text>
            <Text style={[styles.templateName, selectedTemplate?.id === t.id && styles.templateNameSelected]}>
              {t.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Form */}
      <Text style={styles.sectionLabel}>Details</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Challenge name"
        placeholderTextColor="#444"
        maxLength={100}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What is this challenge about?"
        placeholderTextColor="#444"
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <Text style={styles.label}>Daily Requirement</Text>
      <TextInput
        style={styles.input}
        value={dailyRequirement}
        onChangeText={setDailyRequirement}
        placeholder="What participants must do each day"
        placeholderTextColor="#444"
        maxLength={200}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={styles.catEmoji}>{CATEGORY_EMOJI[cat]}</Text>
            <Text style={[styles.catLabel, category === cat && styles.catLabelSelected]}>
              {cat.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Duration (days)</Text>
      <TextInput
        style={styles.input}
        value={durationDays}
        onChangeText={setDurationDays}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={startsAt}
        onChangeText={setStartsAt}
        placeholder="2026-05-13"
        placeholderTextColor="#444"
        maxLength={10}
      />

      <Text style={styles.label}>Research Note (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={researchNote}
        onChangeText={setResearchNote}
        placeholder="Link to supporting research..."
        placeholderTextColor="#444"
        multiline
        numberOfLines={2}
        maxLength={300}
      />

      {/* Visibility toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>{isPublic ? '🌍 Public Challenge' : '🔒 Circle Only'}</Text>
          <Text style={styles.toggleSub}>
            {isPublic ? 'Visible to everyone nearby' : 'Only your circle can join'}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#262626', true: '#f59e0b' }}
          thumbColor={isPublic ? '#fff' : '#888'}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Text style={styles.submitText}>Creating…</Text>
        ) : (
          <>
            <Ionicons name="trophy-outline" size={20} color="#0a0a0a" />
            <Text style={styles.submitText}>Create Challenge</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  templateScroll: { marginBottom: 20, marginHorizontal: -16, paddingHorizontal: 16 },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 6,
  },
  templateChipSelected: { borderColor: '#f59e0b', backgroundColor: '#2a1f08' },
  templateEmoji: { fontSize: 16 },
  templateName: { fontSize: 12, color: '#888', fontWeight: '600', maxWidth: 90 },
  templateNameSelected: { color: '#f59e0b' },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 4,
  },
  catChipSelected: { borderColor: '#f59e0b', backgroundColor: '#2a1f08' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  catLabelSelected: { color: '#f59e0b', fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  toggleSub: { fontSize: 12, color: '#666' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
