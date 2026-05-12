import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEventStore } from '../../store/eventStore';
import EventCard from '../../components/EventCard';
import type { EventWithDistance } from '@disconnect/shared';

export default function MyEventsScreen({ navigation }: { navigation: any }) {
  const { myEvents, isLoading, fetchMyEvents } = useEventStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyEvents();
    setRefreshing(false);
  };

  if (isLoading && !myEvents) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  const now = new Date();
  const hosting = myEvents?.hosting || [];
  const attending = myEvents?.attending || [];

  const upcomingHosting = hosting.filter((e) => new Date(e.startsAt) > now);
  const pastHosting = hosting.filter((e) => new Date(e.startsAt) <= now);
  const upcomingAttending = attending.filter((e) => new Date(e.startsAt) > now);
  const pastAttending = attending.filter((e) => new Date(e.startsAt) <= now);

  const sections = [
    ...(upcomingHosting.length > 0 ? [{ title: 'Hosting — Upcoming', data: upcomingHosting }] : []),
    ...(upcomingAttending.length > 0 ? [{ title: 'Attending — Upcoming', data: upcomingAttending }] : []),
    ...(pastHosting.length > 0 ? [{ title: 'Hosted — Past', data: pastHosting }] : []),
    ...(pastAttending.length > 0 ? [{ title: 'Attended — Past', data: pastAttending }] : []),
  ];

  if (sections.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptyText}>Create an event or RSVP to one to see it here.</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.list}
      sections={sections}
      keyExtractor={(item: EventWithDistance) => item.id}
      renderItem={({ item }: { item: EventWithDistance }) => (
        <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })} />
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#888', marginTop: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  createButton: { backgroundColor: '#4ade80', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  createButtonText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
