import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import EventCard from '../../components/EventCard';
import ActivityFeed from '../../components/ActivityFeed';
import EventSuggestionCard from '../../components/EventSuggestionCard';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      fetchEvents(location.latitude, location.longitude, selectedCategory || undefined, searchQuery || undefined);
    }
  }, [location.loading, location.latitude, location.longitude, selectedCategory, searchQuery]);

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
    await fetchEvents(location.latitude, location.longitude, selectedCategory || undefined, searchQuery || undefined);
    setRefreshing(false);
  }, [location, selectedCategory, searchQuery]);

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
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events..."
          placeholderTextColor="#555"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

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

      {/* Event suggestions from active challenges nearby */}
      {!selectedCategory && (
        <EventSuggestionCard
          lat={location.latitude}
          lng={location.longitude}
          onCreateEvent={(title, category) =>
            navigation.navigate('CreateEvent', { prefillTitle: title, prefillCategory: category })
          }
        />
      )}

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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a',
  },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10, paddingHorizontal: 8 },
  clearButton: { padding: 8 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#555', marginTop: 12 },
  errorText: { color: '#f87171', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#222' },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filters: { maxHeight: 48, marginTop: 10 },
  filtersContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a',
  },
  chipSelected: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  chipText: { fontSize: 13, color: '#888' },
  chipTextSelected: { color: '#0a0a0a', fontWeight: '600' },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#ccc' },
  emptyText: { fontSize: 14, color: '#555', textAlign: 'center' },
  suggestedSection: { marginBottom: 16 },
  suggestedTitle: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestedList: { gap: 12 },
  suggestedCard: { width: 280 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#4ade80', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
