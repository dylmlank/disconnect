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

interface WalkRoom {
  id: string;
  creatorId: string;
  name: string;
  vibe: string;
  roomType: string;
  isPublic: boolean;
  circleId: string | null;
  activeCount: number;
  totalHours: number;
  createdAt: string;
}

const WALK_VIBES = [
  { id: 'hot_girl_walk', label: 'Hot Girl Walk', emoji: '💅' },
  { id: 'nature_walk', label: 'Nature Walk', emoji: '🌿' },
  { id: 'podcast_walk', label: 'Podcast Walk', emoji: '🎧' },
];

function getVibe(id: string) {
  return WALK_VIBES.find((v) => v.id === id) ?? { id, label: id, emoji: '🚶' };
}

function formatDuration(startedAt: string, activeCount: number): string {
  if (activeCount === 0) return 'No walkers';
  const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (mins < 1) return 'Just started';
  if (mins < 60) return `${mins}m walk`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function WalkTalkScreen({ navigation }: { navigation: any }) {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [rooms, setRooms] = useState<WalkRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVibe, setNewVibe] = useState('nature_walk');

  const fetchRooms = useCallback(async (lat?: number, lng?: number) => {
    try {
      const params: Record<string, unknown> = { type: 'walk_talk' };
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

  const handleJoin = async (room: WalkRoom) => {
    try {
      await api.post(`/rooms/${room.id}/join`);
      Alert.alert(
        '🚶 Walk joined!',
        `You're now walking with ${room.name}. The walk is tracked for presence — stay active!`,
        [{ text: 'Let\'s go!', onPress: () => navigation.navigate('Focus') }],
      );
    } catch {
      Alert.alert('Error', 'Could not join walk. Try again.');
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name,
        vibe: newVibe,
        isPublic: true,
        roomType: 'walk_talk',
      };
      if (latitude && longitude) {
        body.latitude = latitude;
        body.longitude = longitude;
      }
      await api.post('/rooms', body);
      setShowCreate(false);
      setNewName('');
      setNewVibe('nature_walk');
      await fetchRooms(latitude || undefined, longitude || undefined);
    } catch {
      Alert.alert('Error', 'Could not start walk. Try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const totalWalkers = rooms.reduce((sum, r) => sum + r.activeCount, 0);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Walk & Talk</Text>
            <Text style={styles.subtitle}>
              {totalWalkers > 0 ? `${totalWalkers} people walking now` : 'Walking together, anywhere'}
            </Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="#0a0a0a" />
            <Text style={styles.createBtnText}>Start a Walk</Text>
          </TouchableOpacity>
        </View>

        {/* Vibe legend */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vibeScroll}
          contentContainerStyle={styles.vibeScrollContent}
        >
          {WALK_VIBES.map((v) => {
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
            <Text style={styles.emptyEmoji}>🚶</Text>
            <Text style={styles.emptyTitle}>No walks yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start a walk</Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyCreateBtnText}>Start a Walk</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomList}>
            {rooms.map((room) => {
              const vibe = getVibe(room.vibe);
              const hasWalkers = room.activeCount > 0;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, hasWalkers && styles.roomCardActive]}
                  onPress={() => handleJoin(room)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomTop}>
                    <View style={[styles.roomEmojiWrap, hasWalkers && styles.roomEmojiWrapActive]}>
                      <Text style={styles.roomEmoji}>{vibe.emoji}</Text>
                    </View>
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomVibe}>{vibe.label}</Text>
                    </View>
                    <View style={styles.roomMeta}>
                      <View style={styles.roomMetaRow}>
                        <Ionicons name="walk-outline" size={13} color="#f59e0b" />
                        <Text style={styles.roomMetaActive}>{room.activeCount}</Text>
                      </View>
                      <Text style={styles.roomMetaHours}>{room.totalHours}h total</Text>
                    </View>
                  </View>

                  {hasWalkers && (
                    <View style={styles.roomFooter}>
                      <View style={styles.activeIndicator} />
                      <Text style={styles.activeText}>
                        {room.activeCount} {room.activeCount === 1 ? 'person' : 'people'} walking now
                      </Text>
                      <View style={styles.joinBadge}>
                        <Text style={styles.joinBadgeText}>Join</Text>
                      </View>
                    </View>
                  )}

                  {!hasWalkers && (
                    <View style={styles.roomFooterInactive}>
                      <Text style={styles.inactiveText}>Tap to start walking</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={14} color="#555" />
          <Text style={styles.infoText}>
            Walk & Talk is a presence feature — see who's walking and for how long. Audio coming soon.
          </Text>
        </View>
      </ScrollView>

      {/* Create Walk Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start a Walk 🚶</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Name your walk"
              placeholderTextColor="#444"
              value={newName}
              onChangeText={setNewName}
              maxLength={50}
              autoFocus
            />

            <Text style={styles.modalLabel}>Walk vibe</Text>
            <View style={styles.modalVibes}>
              {WALK_VIBES.map((v) => (
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
                  setNewVibe('nature_walk');
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
                  <Text style={styles.modalConfirmText}>Let's Walk</Text>
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

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4,
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },

  vibeScroll: { marginBottom: 20 },
  vibeScrollContent: { gap: 8, paddingRight: 4 },
  vibePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  vibePillEmoji: { fontSize: 14 },
  vibePillLabel: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  vibePillCount: {
    fontSize: 11, color: '#f59e0b', fontWeight: '700',
    backgroundColor: '#2a1a00', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },

  roomList: { gap: 10 },
  roomCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  roomCardActive: { borderColor: '#f59e0b44' },
  roomTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomEmojiWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center',
  },
  roomEmojiWrapActive: { backgroundColor: '#2a1a00' },
  roomEmoji: { fontSize: 22 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  roomVibe: { fontSize: 13, color: '#666', marginTop: 2 },
  roomMeta: { alignItems: 'flex-end', gap: 2 },
  roomMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomMetaActive: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
  roomMetaHours: { fontSize: 11, color: '#444' },

  roomFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#262626',
  },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  activeText: { fontSize: 12, color: '#f59e0b', fontWeight: '600', flex: 1 },
  joinBadge: {
    backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  joinBadgeText: { fontSize: 11, fontWeight: '700', color: '#0a0a0a' },

  roomFooterInactive: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#262626',
  },
  inactiveText: { fontSize: 12, color: '#444' },

  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 24, paddingHorizontal: 4,
  },
  infoText: { fontSize: 12, color: '#444', flex: 1, lineHeight: 17 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  emptySubtext: { fontSize: 14, color: '#555' },
  emptyCreateBtn: {
    marginTop: 12, backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
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
  modalVibeBtnActive: { borderColor: '#f59e0b', backgroundColor: '#2a1a00' },
  modalVibeEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  modalVibeLabel: { fontSize: 15, fontWeight: '600', color: '#888' },
  modalVibeLabelActive: { color: '#f59e0b' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#262626', borderWidth: 1, borderColor: '#333',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  modalConfirm: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f59e0b',
  },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
});
