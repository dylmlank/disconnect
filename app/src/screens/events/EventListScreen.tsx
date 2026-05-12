import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import EventCard from '../../components/EventCard';
import ActivityFeed from '../../components/ActivityFeed';
import { EVENT_CATEGORIES } from '../../constants/categories';
import type { EventCategory, EventWithDistance } from '@disconnect/shared';
import api from '../../services/api';

export default function EventListScreen({ navigation }: { navigation: any }) {
  const { events, isLoading, fetchEvents } = useEventStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [suggested, setSuggested] = useState<EventWithDistance[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('MyEvents')} style={{ marginRight: 12 }}>
          <Ionicons name="list-outline" size={22} color="#4ade80" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchEvents(location.latitude, location.longitude, selectedCategory || undefined);
    }
  }, [location.loading, location.latitude, location.longitude, selectedCategory]);

  // Fetch suggested events when no filter is active
  useEffect(() => {
    if (location.loading || location.error || selectedCategory) {
      setSuggested([]);
      return;
    }
    api.get('/events/suggested', { params: { lat: location.latitude, lng: location.longitude } })
      .then(({ data }) => setSuggested(data.events))
      .catch(() => setSuggested([]));
  }, [location.loading, location.latitude, location.longitude, selectedCategory]);

  const onRefresh = useCallback(async () => {
    if (location.loading || location.error) return;
    setRefreshing(true);
    await fetchEvents(location.latitude, location.longitude, selectedCategory || undefined);
    setRefreshing(false);
  }, [location, selectedCategory]);

  if (location.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  if (location.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{location.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={location.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter suggested to only show events NOT already in the main list
  const eventIds = new Set(events.map((e) => e.id));
  const filteredSuggested = suggested.filter((e) => !eventIds.has(e.id));

  return (
    <View style={styles.container}>
      {/* Category filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, label: 'All', emoji: '' }, ...EVENT_CATEGORIES]}
        keyExtractor={(item) => item.id || 'all'}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, (item.id || null) === selectedCategory && styles.chipSelected]}
            onPress={() => setSelectedCategory(item.id as EventCategory | null)}
          >
            <Text style={[styles.chipText, (item.id || null) === selectedCategory && styles.chipTextSelected]}>
              {item.emoji ? `${item.emoji} ` : ''}{item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Activity feed — lightweight, non-addictive */}
      <ActivityFeed
        lat={location.latitude}
        lng={location.longitude}
        onEventPress={(eventId) => navigation.navigate('EventDetail', { eventId })}
      />

      {/* Event list - finite, no infinite scroll */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#4ade80" style={{ marginTop: 40 }} />
      ) : events.length === 0 && filteredSuggested.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No events nearby</Text>
          <Text style={styles.emptyText}>Be the first to create one and get people together.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })} />
          )}
          ListHeaderComponent={
            filteredSuggested.length > 0 ? (
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedTitle}>Suggested for you</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={filteredSuggested}
                  keyExtractor={(item) => `suggested-${item.id}`}
                  contentContainerStyle={styles.suggestedList}
                  renderItem={({ item }) => (
                    <View style={styles.suggestedCard}>
                      <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })} />
                    </View>
                  )}
                />
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Create event FAB — adults only */}
      {user && !user.isMinor && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.fabText}>+ Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#888', marginTop: 12 },
  errorText: { color: '#f87171', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#262626', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filters: { maxHeight: 52, marginTop: 8 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
  },
  chipSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipText: { fontSize: 13, color: '#ccc' },
  chipTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  suggestedSection: { marginBottom: 16 },
  suggestedTitle: { fontSize: 16, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestedList: { gap: 12 },
  suggestedCard: { width: 280 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#4ade80', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
