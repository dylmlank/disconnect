import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../store/habitStore';
import { useCheckInStore } from '../../store/checkinStore';
import { useCircleStore } from '../../store/circleStore';
import { useFocusStore } from '../../store/focusStore';
import { CURATED_HABITS } from '@disconnect/shared';

export default function HubScreen({ navigation }: { navigation: any }) {
  const { habits, todayLogs, fetchHabits, logHabit } = useHabitStore();
  const { today: todayCheckIn, fetchToday } = useCheckInStore();
  const { circles, fetchCircles } = useCircleStore();
  const { activeSessions, fetchActive } = useFocusStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchHabits(),
      fetchToday(),
      fetchCircles(),
      fetchActive(),
    ]).finally(() => setLoading(false));
  }, []);

  const completedHabits = todayLogs.length;
  const totalHabits = habits.length;
  const moodEmojis: Record<number, string> = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <Text style={styles.title}>Today</Text>

      {/* Habits section */}
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('Habits')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <Ionicons name="leaf-outline" size={20} color="#4ade80" />
          <Text style={styles.sectionTitle}>Habits</Text>
          <Text style={styles.sectionBadge}>{completedHabits}/{totalHabits}</Text>
        </View>
        {habits.length === 0 ? (
          <Text style={styles.sectionEmpty}>Tap to set up your daily habits</Text>
        ) : (
          <View style={styles.habitDots}>
            {habits.map((h) => {
              const logged = todayLogs.some((l) => l.habitId === h.habitId);
              const def = CURATED_HABITS.find((c) => c.id === h.habitId);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitDot, logged && styles.habitDotDone]}
                  onPress={() => !logged && logHabit(h.habitId)}
                >
                  <Text style={styles.habitEmoji}>{def?.emoji || '⭐'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>

      {/* Check-in section */}
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('CheckIn')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart-outline" size={20} color="#4ade80" />
          <Text style={styles.sectionTitle}>Check-in</Text>
        </View>
        {todayCheckIn ? (
          <View style={styles.checkInDone}>
            <Text style={styles.checkInMood}>{moodEmojis[todayCheckIn.mood]}</Text>
            <Text style={styles.checkInText}>Done for today</Text>
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>How are you feeling? Tap to reflect.</Text>
        )}
      </TouchableOpacity>

      {/* Focus section */}
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('Focus')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <Ionicons name="timer-outline" size={20} color="#60a5fa" />
          <Text style={styles.sectionTitle}>Focus</Text>
        </View>
        {activeSessions.length > 0 ? (
          <Text style={styles.focusActive}>
            {activeSessions.length} {activeSessions.length === 1 ? 'person' : 'people'} focusing now
          </Text>
        ) : (
          <Text style={styles.sectionEmpty}>Start a focus session</Text>
        )}
      </TouchableOpacity>

      {/* Challenges */}
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('Challenges')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Challenges</Text>
        </View>
        <Text style={styles.sectionEmpty}>Join or create a challenge</Text>
      </TouchableOpacity>

      {/* Circles */}
      <TouchableOpacity style={styles.section} onPress={() => navigation.navigate('Circles')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={20} color="#4ade80" />
          <Text style={styles.sectionTitle}>Circles</Text>
          {circles.length > 0 && <Text style={styles.sectionBadge}>{circles.length}</Text>}
        </View>
        {circles.length === 0 ? (
          <Text style={styles.sectionEmpty}>Create or join a circle for accountability</Text>
        ) : (
          <View style={styles.circleNames}>
            {circles.map((c) => (
              <Text key={c.id} style={styles.circleName}>{c.name}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Anti-screen-time nudge */}
      <View style={styles.nudge}>
        <Text style={styles.nudgeText}>Pick something and go. The world is waiting.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20 },
  section: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#262626',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  sectionBadge: { fontSize: 13, fontWeight: '700', color: '#4ade80', backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sectionEmpty: { fontSize: 13, color: '#666' },
  habitDots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  habitDot: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center',
  },
  habitDotDone: { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#4ade80' },
  habitEmoji: { fontSize: 18 },
  checkInDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkInMood: { fontSize: 24 },
  checkInText: { fontSize: 13, color: '#4ade80', fontWeight: '600' },
  focusActive: { fontSize: 13, color: '#60a5fa', fontWeight: '600' },
  circleNames: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  circleName: { fontSize: 13, color: '#ccc', backgroundColor: '#262626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  nudge: { marginTop: 20, alignItems: 'center' },
  nudgeText: { fontSize: 13, color: '#444', fontStyle: 'italic' },
});
