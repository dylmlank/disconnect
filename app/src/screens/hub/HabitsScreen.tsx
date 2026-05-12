import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../store/habitStore';
import HabitRow from '../../components/HabitRow';
import { CURATED_HABITS, MAX_HABITS } from '../../constants/habits';
import type { HabitDefinition } from '@disconnect/shared';

export default function HabitsScreen() {
  const { habits, todayLogs, streaks, isLoading, fetchHabits, addHabit, removeHabit, logHabit, unlogHabit, fetchStreaks } =
    useHabitStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHabits();
    fetchStreaks();
  }, []);

  const trackedIds = new Set(habits.map((h) => h.habitId));

  async function handleAdd(def: HabitDefinition) {
    try {
      await addHabit(def.id);
      setShowModal(false);
      fetchStreaks();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to add habit')
        : 'Failed to add habit';
      Alert.alert('Error', msg);
    }
  }

  async function handleRemove(habitId: string) {
    Alert.alert('Remove Habit', 'Remove this habit from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeHabit(habitId);
          fetchStreaks();
        },
      },
    ]);
  }

  async function handleLog(habitId: string) {
    await logHabit(habitId);
    fetchStreaks();
  }

  async function handleUnlog(habitId: string) {
    const today = new Date().toISOString().slice(0, 10);
    await unlogHabit(habitId, today);
    fetchStreaks();
  }

  const canAdd = habits.length < MAX_HABITS;

  return (
    <View style={styles.container}>
      {isLoading && habits.length === 0 ? (
        <ActivityIndicator size="large" color="#4ade80" style={{ marginTop: 40 }} />
      ) : habits.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={48} color="#333" />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyText}>Add up to {MAX_HABITS} habits to track daily.</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onLongPress={() => handleRemove(item.habitId)} activeOpacity={1}>
              <HabitRow
                habit={item}
                todayLog={todayLogs.find((l) => l.habitId === item.habitId)}
                streak={streaks.find((s) => s.habitId === item.habitId)}
                onLog={() => handleLog(item.habitId)}
                onUnlog={() => handleUnlog(item.habitId)}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {canAdd && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#0a0a0a" />
            <Text style={styles.addButtonText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.hint}>Long-press a habit to remove it</Text>

      {/* Add Habit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose a Habit</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(CURATED_HABITS as readonly HabitDefinition[]).map((def) => {
                const isTracked = trackedIds.has(def.id);
                return (
                  <TouchableOpacity
                    key={def.id}
                    style={[styles.optionRow, isTracked && styles.optionRowDisabled]}
                    onPress={() => !isTracked && handleAdd(def)}
                    disabled={isTracked}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionEmoji}>{def.emoji}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionName, isTracked && styles.optionNameDisabled]}>
                        {def.name}
                      </Text>
                      <Text style={styles.optionDesc} numberOfLines={2}>{def.description}</Text>
                      <Text style={styles.optionCitation} numberOfLines={1}>{def.citation}</Text>
                    </View>
                    {isTracked && (
                      <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { padding: 16, paddingBottom: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  footer: { padding: 16, paddingTop: 8 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  addButtonText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  hint: { fontSize: 12, color: '#444', textAlign: 'center', paddingBottom: 12 },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    gap: 12,
  },
  optionRowDisabled: { opacity: 0.4 },
  optionEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  optionInfo: { flex: 1 },
  optionName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  optionNameDisabled: { color: '#888' },
  optionDesc: { fontSize: 12, color: '#888', lineHeight: 16 },
  optionCitation: { fontSize: 10, color: '#555', marginTop: 2 },
});
