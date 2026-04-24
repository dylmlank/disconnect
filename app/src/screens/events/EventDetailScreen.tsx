import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
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
          fetchEvent(eventId); // refresh to remove blocked user
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badges}>
        <Text style={styles.category}>
          {category?.emoji} {category?.label}
        </Text>
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
      <Text style={styles.title}>{currentEvent.title}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>When</Text>
        <Text style={styles.infoValue}>
          {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {' at '}
          {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>

      {currentEvent.address && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Where</Text>
          <Text style={styles.infoValue}>{currentEvent.address}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Going</Text>
        <Text style={styles.infoValue}>
          {currentEvent.attendeeCount} / {currentEvent.maxAttendees}
        </Text>
      </View>

      {currentEvent.description && (
        <Text style={styles.description}>{currentEvent.description}</Text>
      )}

      <Text style={styles.hostedBy}>
        Hosted by {currentEvent.creator.firstName}
      </Text>

      {/* Attendees */}
      {currentEvent.attendees.length > 0 && (
        <View style={styles.attendeesSection}>
          <Text style={styles.sectionTitle}>{"Who's going"}</Text>
          {currentEvent.attendees.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.attendee}
              onLongPress={() => handleBlock(a.id, a.firstName)}
              delayLongPress={500}
            >
              <View style={{ marginRight: 12 }}>
                <UserAvatar firstName={a.firstName} photoUrl={a.photoUrl} size={36} />
              </View>
              <Text style={styles.attendeeName}>{a.firstName}</Text>
              {a.id !== user?.id && <Text style={styles.blockHint}>Hold to block</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* RSVP Button */}
      {!isCreator && (
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
            {currentEvent.hasRsvp ? "Leave Event" : isFull ? "Event Full" : "I'm Going"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Chat button */}
      {currentEvent.chatUnlocked && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('EventChat', { eventId, title: currentEvent.title })}
        >
          <Text style={styles.chatButtonText}>Open Group Chat</Text>
        </TouchableOpacity>
      )}

      {/* Delete button for creator */}
      {isCreator && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Event</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  category: { fontSize: 14, color: '#4ade80', fontWeight: '600' },
  ageBadge: { backgroundColor: '#1a3a1a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  ageBadgeText: { fontSize: 11, fontWeight: '600', color: '#4ade80' },
  ageBadge18: { backgroundColor: '#3a2a00' },
  ageBadgeText18: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8, marginBottom: 24 },
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#888', width: 60, fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#fff', flex: 1 },
  description: { fontSize: 15, color: '#ccc', lineHeight: 22, marginTop: 16, marginBottom: 16 },
  hostedBy: { fontSize: 13, color: '#888', marginBottom: 24 },
  attendeesSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  attendee: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4ade80' },
  attendeeName: { flex: 1, fontSize: 15, color: '#fff' },
  blockHint: { fontSize: 11, color: '#555' },
  rsvpButton: {
    backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  rsvpButtonLeave: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f87171' },
  rsvpButtonDisabled: { backgroundColor: '#333' },
  rsvpText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  rsvpTextLeave: { color: '#f87171' },
  chatButton: {
    backgroundColor: '#262626', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
  },
  chatButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  deleteButton: {
    backgroundColor: 'transparent', borderRadius: 12, padding: 16, alignItems: 'center',
    marginTop: 24, borderWidth: 1, borderColor: '#f87171',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#f87171' },
});
