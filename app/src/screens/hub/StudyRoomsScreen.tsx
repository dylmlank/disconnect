import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useLocation } from '../../hooks/useLocation';

interface StudyRoom {
  id: string;
  creatorId: string;
  name: string;
  vibe: string;
  isPublic: boolean;
  circleId: string | null;
  activeCount: number;
  totalHours: number;
  createdAt: string;
}

const ROOM_VIBES = [
  { id: 'lofi', label: 'Lo-fi Chill', emoji: '🎵' },
  { id: 'deep_work', label: 'Deep Work', emoji: '🧠' },
  { id: 'morning', label: 'Morning Grind', emoji: '☀️' },
  { id: 'library', label: 'Library Mode', emoji: '📚' },
  { id: 'night_owl', label: 'Night Owl', emoji: '🦉' },
];

function getVibe(id: string) {
  return ROOM_VIBES.find((v) => v.id === id) ?? { id, label: id, emoji: '📖' };
}

export default function StudyRoomsScreen({ navigation }: { navigation: any }) {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVibe, setNewVibe] = useState('lofi');

  const fetchRooms = useCallback(async (lat?: number, lng?: number) => {
    try {
      const params: Record<string, number> = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      const { data } = await api.get('/rooms', { params });
      setRooms(data.rooms ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!locationLoading) {
      fetchRooms(latitude || undefined, longitude || undefined).finally(() =>
        setLoading(false),
      );
    }
  }, [locationLoading, latitude, longitude]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRooms(latitude || undefined, longitude || undefined);
    setRefreshing(false);
  };

  const handleJoin = async (room: StudyRoom) => {
    try {
      await api.post(`/rooms/${room.id}/join`);
      navigation.navigate('Focus');
    } catch {
      Alert.alert('Error', 'Could not join room. Try again.');
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = { name, vibe: newVibe, isPublic: true };
      if (latitude && longitude) {
        body.latitude = latitude;
        body.longitude = longitude;
      }
      await api.post('/rooms', body);
      setShowCreate(false);
      setNewName('');
      setNewVibe('lofi');
      await fetchRooms(latitude || undefined, longitude || undefined);
    } catch {
      Alert.alert('Error', 'Could not create room. Try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ade80" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Study Rooms</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="#0a0a0a" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Focus with people nearby</Text>

        {/* Vibe filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vibeScroll}
          contentContainerStyle={styles.vibeScrollContent}
        >
          {ROOM_VIBES.map((v) => {
            const count = rooms.filter((r) => r.vibe === v.id).length;
            return (
              <View key={v.id} style={styles.vibePill}>
                <Text style={styles.vibePillEmoji}>{v.emoji}</Text>
                <Text style={styles.vibePillLabel}>{v.label}</Text>
                {count > 0 && <Text style={styles.vibePillCount}>{count}</Text>}
              </View>
            );
          })}
        </ScrollView>

        {/* Room list */}
        {rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>No rooms yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create one</Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyCreateBtnText}>Create a Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomList}>
            {rooms.map((room) => {
              const vibe = getVibe(room.vibe);
              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => handleJoin(room)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomTop}>
                    <Text style={styles.roomEmoji}>{vibe.emoji}</Text>
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomVibe}>{vibe.label}</Text>
                    </View>
                    <View style={styles.roomMeta}>
                      <View style={styles.roomMetaRow}>
                        <Ionicons name="person-outline" size={12} color="#4ade80" />
                        <Text style={styles.roomMetaActive}>{room.activeCount}</Text>
                      </View>
                      <Text style={styles.roomMetaHours}>{room.totalHours}h logged</Text>
                    </View>
                  </View>

                  {room.activeCount > 0 && (
                    <View style={styles.roomFooter}>
                      <View style={styles.activeIndicator} />
                      <Text style={styles.activeText}>
                        {room.activeCount} {room.activeCount === 1 ? 'person' : 'people'} focusing now
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Room Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Room</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Room name"
              placeholderTextColor="#444"
              value={newName}
              onChangeText={setNewName}
              maxLength={50}
              autoFocus
            />

            <Text style={styles.modalLabel}>Vibe</Text>
            <View style={styles.modalVibes}>
              {ROOM_VIBES.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.modalVibeBtn, newVibe === v.id && styles.modalVibeBtnActive]}
                  onPress={() => setNewVibe(v.id)}
                >
                  <Text style={styles.modalVibeEmoji}>{v.emoji}</Text>
                  <Text style={[styles.modalVibeLabel, newVibe === v.id && styles.modalVibeLabelActive]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowCreate(false);
                  setNewName('');
                  setNewVibe('lofi');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!newName.trim() || creating) && styles.modalConfirmDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#0a0a0a" />
                ) : (
                  <Text style={styles.modalConfirmText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#4ade80', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 16 },

  vibeScroll: { marginBottom: 20 },
  vibeScrollContent: { gap: 8, paddingRight: 4 },
  vibePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#262626',
  },
  vibePillEmoji: { fontSize: 14 },
  vibePillLabel: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  vibePillCount: {
    fontSize: 11, color: '#4ade80', fontWeight: '700',
    backgroundColor: '#0a2a0a', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },

  roomList: { gap: 10 },
  roomCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#262626',
  },
  roomTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  roomVibe: { fontSize: 13, color: '#666', marginTop: 2 },
  roomMeta: { alignItems: 'flex-end', gap: 2 },
  roomMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomMetaActive: { fontSize: 14, fontWeight: '700', color: '#4ade80' },
  roomMetaHours: { fontSize: 11, color: '#444' },
  roomFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#262626' },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  activeText: { fontSize: 12, color: '#4ade80', fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  emptySubtext: { fontSize: 14, color: '#555' },
  emptyCreateBtn: {
    marginTop: 12, backgroundColor: '#4ade80', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyCreateBtnText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#262626',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#262626', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333',
  },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalVibes: { gap: 8, marginBottom: 24 },
  modalVibeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#262626', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#333',
  },
  modalVibeBtnActive: { borderColor: '#4ade80', backgroundColor: '#0a2a0a' },
  modalVibeEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  modalVibeLabel: { fontSize: 15, fontWeight: '600', color: '#888' },
  modalVibeLabelActive: { color: '#4ade80' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#262626', borderWidth: 1, borderColor: '#333',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  modalConfirm: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#4ade80',
  },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
});
