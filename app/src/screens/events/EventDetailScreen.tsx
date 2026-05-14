import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { EVENT_CATEGORIES } from '../../constants/categories';
import UserAvatar from '../../components/UserAvatar';
import api from '../../services/api';

export default function EventDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { eventId } = route.params;
  const { currentEvent, isLoading, fetchEvent, rsvp, unRsvp, deleteEvent } = useEventStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchEvent(eventId);
  }, [eventId]);

  if (isLoading || !currentEvent) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  const category = EVENT_CATEGORIES.find((c) => c.id === currentEvent.category);
  const date = new Date(currentEvent.startsAt);
  const isFull = currentEvent.attendeeCount >= currentEvent.maxAttendees;
  const isCreator = user?.id === currentEvent.creator.id;
  const spotsLeft = currentEvent.maxAttendees - currentEvent.attendeeCount;

  const handleRsvp = async () => {
    if (currentEvent.hasRsvp) {
      await unRsvp(currentEvent.id);
    } else {
      await rsvp(currentEvent.id);
    }
  };

  const handleBlock = (userId: string, name: string) => {
    if (userId === user?.id) return;
    Alert.alert('Block User', `Block ${name}? They won't appear in your events or beacons.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          await api.post('/blocks', { userId });
          fetchEvent(eventId);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(currentEvent.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Category + Age badge */}
        <View style={styles.topRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryEmoji}>{category?.emoji}</Text>
            <Text style={styles.categoryLabel}>{category?.label}</Text>
          </View>
          {currentEvent.allAges ? (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>All Ages</Text>
            </View>
          ) : (
            <View style={[styles.ageBadge, styles.ageBadge18]}>
              <Text style={styles.ageBadgeText18}>18+</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentEvent.title}</Text>

        {/* Info cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={18} color="#4ade80" />
            <View>
              <Text style={styles.infoMain}>
                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.infoSub}>
                {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          {currentEvent.address && (
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={18} color="#60a5fa" />
              <Text style={styles.infoMain} numberOfLines={2}>{currentEvent.address}</Text>
            </View>
          )}
          <View style={styles.infoCard}>
            <Ionicons name="people-outline" size={18} color="#f59e0b" />
            <View>
              <Text style={styles.infoMain}>
                {currentEvent.attendeeCount} / {currentEvent.maxAttendees} going
              </Text>
              {spotsLeft <= 5 && spotsLeft > 0 && (
                <Text style={styles.spotsWarning}>{spotsLeft} spots left</Text>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {currentEvent.description && (
          <Text style={styles.description}>{currentEvent.description}</Text>
        )}

        {/* Host */}
        <View style={styles.hostRow}>
          <UserAvatar firstName={currentEvent.creator.firstName} photoUrl={currentEvent.creator.photoUrl} size={32} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.hostLabel}>Hosted by</Text>
            <Text style={styles.hostName}>{currentEvent.creator.firstName}</Text>
          </View>
        </View>

        {/* Attendees */}
        {currentEvent.attendees.length > 0 && (
          <View style={styles.attendeesSection}>
            <Text style={styles.sectionTitle}>Who's going</Text>
            <View style={styles.attendeeList}>
              {currentEvent.attendees.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.attendee}
                  onPress={() => a.id !== user?.id && navigation.navigate('UserProfile', { userId: a.id })}
                  onLongPress={() => handleBlock(a.id, a.firstName)}
                  delayLongPress={500}
                >
                  <UserAvatar firstName={a.firstName} photoUrl={a.photoUrl} size={36} />
                  <Text style={styles.attendeeName}>{a.firstName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View style={styles.bottomBar}>
        {currentEvent.chatUnlocked && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('EventChat', { eventId, title: currentEvent.title })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {!isCreator ? (
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              currentEvent.hasRsvp && styles.rsvpButtonLeave,
              isFull && !currentEvent.hasRsvp && styles.rsvpButtonDisabled,
            ]}
            onPress={handleRsvp}
            disabled={isFull && !currentEvent.hasRsvp}
          >
            <Text style={[styles.rsvpText, currentEvent.hasRsvp && styles.rsvpTextLeave]}>
              {currentEvent.hasRsvp ? "Leave" : isFull ? "Full" : "I'm Going"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#f87171" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0a2a0a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  ageBadge: { backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ageBadgeText: { fontSize: 11, fontWeight: '600', color: '#4ade80' },
  ageBadge18: { backgroundColor: '#2a1a00' },
  ageBadgeText18: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },

  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 14, marginBottom: 20, lineHeight: 32 },

  infoCards: { gap: 10, marginBottom: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  infoMain: { fontSize: 14, color: '#eee', fontWeight: '500' },
  infoSub: { fontSize: 12, color: '#888', marginTop: 1 },
  spotsWarning: { fontSize: 11, color: '#f59e0b', fontWeight: '600', marginTop: 2 },

  description: { fontSize: 15, color: '#bbb', lineHeight: 23, marginBottom: 20 },

  hostRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  hostLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  hostName: { fontSize: 14, color: '#fff', fontWeight: '600' },

  attendeesSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  attendeeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  attendee: { alignItems: 'center', width: 56 },
  attendeeName: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },

  // Sticky bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, paddingBottom: 28,
    backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#141414',
  },
  chatBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  rsvpButton: {
    flex: 1, backgroundColor: '#4ade80', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  rsvpButtonLeave: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f87171' },
  rsvpButtonDisabled: { backgroundColor: '#222' },
  rsvpText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  rsvpTextLeave: { color: '#f87171' },
  deleteButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f87171',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#f87171' },
});
