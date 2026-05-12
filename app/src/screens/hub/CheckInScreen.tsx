import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCheckInStore } from '../../store/checkinStore';
import MoodSelector from '../../components/MoodSelector';

const MOOD_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Meh',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing',
};

const ENCOURAGING_MESSAGES = [
  "Great work showing up for yourself today! 🌱",
  "You're building a great habit — keep it up! ✨",
  "That's a great reflection. Now go enjoy your day! 🌿",
  "Taking 2 minutes to reflect is a superpower. Well done! 💚",
  "Gratitude noted. You've got this! 🎯",
];

export default function CheckInScreen() {
  const { today, isLoading, fetchToday, submitCheckIn } = useCheckInStore();
  const [mood, setMood] = useState<number | null>(null);
  const [good1, setGood1] = useState('');
  const [good2, setGood2] = useState('');
  const [good3, setGood3] = useState('');
  const [intention, setIntention] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchToday();
  }, []);

  const canSubmit = mood !== null && good1.trim().length > 0 && good2.trim().length > 0 && good3.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || !mood) return;
    setSubmitting(true);
    try {
      await submitCheckIn({
        mood,
        goodThing1: good1.trim(),
        goodThing2: good2.trim(),
        goodThing3: good3.trim(),
        intention: intention.trim() || undefined,
      });
      const randomMsg = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
      setMessage(randomMsg);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  // Already checked in — show read-only view
  const existing = today;
  if (existing && !submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>Already checked in today</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Mood</Text>
          <Text style={styles.readValue}>
            {['😞', '😐', '🙂', '😊', '🤩'][existing.mood - 1]} {MOOD_LABELS[existing.mood]}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>3 Good Things</Text>
          <Text style={styles.readValue}>1. {existing.goodThing1}</Text>
          <Text style={styles.readValue}>2. {existing.goodThing2}</Text>
          <Text style={styles.readValue}>3. {existing.goodThing3}</Text>
        </View>
        {existing.intention ? (
          <View style={styles.section}>
            <Text style={styles.label}>Intention</Text>
            <Text style={styles.readValue}>{existing.intention}</Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  // Submission success screen
  if (submitted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successEmoji}>🌱</Text>
        <Text style={styles.successMessage}>{message}</Text>
        <Text style={styles.successHint}>Consider closing the app and doing something real today.</Text>
      </View>
    );
  }

  // Check-in form
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>How are you feeling?</Text>
        <MoodSelector value={mood} onChange={setMood} />
        {mood !== null && (
          <Text style={styles.moodLabel}>{MOOD_LABELS[mood]}</Text>
        )}

        <Text style={styles.sectionHeading}>3 good things today</Text>
        <Text style={styles.sectionSubheading}>What are three things you're grateful for?</Text>

        <TextInput
          style={styles.input}
          placeholder="First good thing…"
          placeholderTextColor="#555"
          value={good1}
          onChangeText={setGood1}
          maxLength={100}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Second good thing…"
          placeholderTextColor="#555"
          value={good2}
          onChangeText={setGood2}
          maxLength={100}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Third good thing…"
          placeholderTextColor="#555"
          value={good3}
          onChangeText={setGood3}
          maxLength={100}
          returnKeyType="next"
        />

        <Text style={styles.sectionHeading}>
          Intention <Text style={styles.optional}>(optional)</Text>
        </Text>
        <Text style={styles.sectionSubheading}>What's one thing you want to focus on today?</Text>
        <TextInput
          style={styles.input}
          placeholder="My intention today is…"
          placeholderTextColor="#555"
          value={intention}
          onChangeText={setIntention}
          maxLength={50}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#0a0a0a" />
              <Text style={styles.submitText}>Submit Check-In</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 32 },

  heading: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 20 },
  moodLabel: { fontSize: 14, color: '#4ade80', textAlign: 'center', marginTop: 10, marginBottom: 4 },

  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 24, marginBottom: 4 },
  sectionSubheading: { fontSize: 13, color: '#666', marginBottom: 12 },
  optional: { fontSize: 13, fontWeight: '400', color: '#555' },

  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    color: '#fff',
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },

  // Read-only view
  doneCard: {
    backgroundColor: '#0a2a0a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1a4a1a',
  },
  doneEmoji: { fontSize: 36, marginBottom: 8 },
  doneTitle: { fontSize: 18, fontWeight: '700', color: '#4ade80' },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  readValue: { fontSize: 15, color: '#ccc', marginBottom: 4, lineHeight: 22 },

  // Success
  successEmoji: { fontSize: 64, marginBottom: 20 },
  successMessage: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 26 },
  successHint: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
