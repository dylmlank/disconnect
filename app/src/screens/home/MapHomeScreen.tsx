import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBeaconStore } from '../../store/beaconStore';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import api from '../../services/api';
import WebMap from '../../components/WebMap';
import UserAvatar from '../../components/UserAvatar';
import type { BeaconWithCreator, EventWithDistance, EventCategory } from '@disconnect/shared';
import { EVENT_CATEGORIES } from '@disconnect/shared';

// react-native-maps crashes on web — load conditionally
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

type TimeFilter = 'now' | 'today' | 'week' | 'all';
type ViewMode = 'map' | 'list';

interface FilterState {
  category: EventCategory | null;
  time: TimeFilter;
  distance: number; // in miles
}

const TIME_OPTIONS: { id: TimeFilter; label: string }[] = [
  { id: 'now', label: 'Happening Now' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'all', label: 'All' },
];

const DISTANCE_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: '1 mi' },
  { id: 5, label: '5 mi' },
  { id: 10, label: '10 mi' },
  { id: 25, label: '25 mi' },
];

function timeFilterEvents(events: EventWithDistance[], time: TimeFilter): EventWithDistance[] {
  if (time === 'all') return events;
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return events.filter((e) => {
    const start = new Date(e.startsAt);
    if (time === 'now') {
      // Events starting within the next 2 hours
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return start >= now && start <= twoHoursFromNow;
    }
    if (time === 'today') return start >= now && start <= todayEnd;
    if (time === 'week') return start >= now && start <= weekEnd;
    return true;
  });
}

function distanceFilter<T extends { distance: number }>(items: T[], maxMiles: number): T[] {
  const maxMeters = maxMiles * 1609.34;
  return items.filter((item) => item.distance <= maxMeters);
}

export default function MapHomeScreen({ navigation }: { navigation: any }) {
  const { beacons, isLoading: beaconsLoading, fetchBeacons, expressInterest } = useBeaconStore();
  const { events, isLoading: eventsLoading, fetchEvents } = useEventStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [filters, setFilters] = useState<FilterState>({
    category: null,
    time: 'all',
    distance: 25,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedBeacon, setSelectedBeacon] = useState<BeaconWithCreator | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDistance | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data on location ready
  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchBeacons(location.latitude, location.longitude);
      fetchEvents(location.latitude, location.longitude);
    }
  }, [location.loading, location.latitude, location.longitude]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (location.loading || location.error) return;
    const interval = setInterval(() => {
      fetchBeacons(location.latitude, location.longitude);
      fetchEvents(location.latitude, location.longitude);
    }, 30000);
    return () => clearInterval(interval);
  }, [location.loading, location.latitude, location.longitude]);

  // Apply filters
  const filteredBeacons = useMemo(() => {
    // Beacons are already filtered by radius on the server
    return beacons;
  }, [beacons]);

  const filteredEvents = useMemo(() => {
    let result = events as EventWithDistance[];
    result = timeFilterEvents(result, filters.time);
    result = distanceFilter(result, filters.distance);
    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }
    return result;
  }, [events, filters.time, filters.distance, filters.category]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.time !== 'all') count++;
    if (filters.distance !== 25) count++;
    return count;
  }, [filters]);

  // Map pins for both beacons and events
  const mapPins = useMemo(
    () => [
      ...filteredBeacons.map((b) => ({
        id: `beacon-${b.id}`,
        type: 'beacon' as const,
        latitude: b.location.latitude,
        longitude: b.location.longitude,
        title: b.message,
        subtitle: `${b.creator.firstName}${b.activity ? ` · ${b.activity}` : ''}`,
        color: '#f59e0b',
        data: b,
      })),
      ...filteredEvents.map((e) => ({
        id: `event-${e.id}`,
        type: 'event' as const,
        latitude: e.location.latitude,
        longitude: e.location.longitude,
        title: e.title,
        subtitle: `${e.creator.firstName} · ${e.attendeeCount} going`,
        color: '#4ade80',
        data: e,
      })),
    ],
    [filteredBeacons, filteredEvents],
  );

  // Web-safe pins (without extra fields)
  const webPins = useMemo(() => mapPins.map(({ type, data, ...pin }) => pin), [mapPins]);

  const handlePinPress = (pin: (typeof mapPins)[0]) => {
    if (pin.type === 'beacon') {
      setSelectedBeacon(pin.data);
    } else {
      setSelectedEvent(pin.data);
    }
  };

  const handleBeaconInterest = async (beacon: BeaconWithCreator) => {
    await expressInterest(beacon.id);
    setSelectedBeacon(null);
  };

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

  const isLoading = beaconsLoading || eventsLoading;

  return (
    <View style={styles.container}>
      {/* Header with filters toggle */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={18} color={activeFilterCount > 0 ? '#4ade80' : '#888'} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map" size={18} color={viewMode === 'map' ? '#0a0a0a' : '#888'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={18} color={viewMode === 'list' ? '#0a0a0a' : '#888'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <UserAvatar firstName={user?.firstName || ''} photoUrl={user?.photoUrl} size={32} />
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.filterChip, filters.time === opt.id && styles.filterChipActive]}
                    onPress={() => setFilters((f) => ({ ...f, time: opt.id }))}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.time === opt.id && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Distance</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DISTANCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.filterChip,
                      filters.distance === opt.id && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters((f) => ({ ...f, distance: opt.id }))}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.distance === opt.id && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !filters.category && styles.filterChipActive]}
                  onPress={() => setFilters((f) => ({ ...f, category: null }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !filters.category && styles.filterChipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {EVENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.filterChip,
                      filters.category === cat.id && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters((f) => ({ ...f, category: cat.id }))}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.category === cat.id && styles.filterChipTextActive,
                      ]}
                    >
                      {cat.emoji} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Map or List view */}
      {viewMode === 'map' ? (
        MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation
            userInterfaceStyle="dark"
          >
            {mapPins.map((pin) => (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
                pinColor={pin.color}
                onPress={() => handlePinPress(pin)}
              >
                <Callout>
                  <View style={{ padding: 4, maxWidth: 200 }}>
                    <Text style={{ fontWeight: '700' }}>{pin.title}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{pin.subtitle}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <WebMap
            latitude={location.latitude}
            longitude={location.longitude}
            pins={webPins}
            onPinPress={(pin) => {
              const fullPin = mapPins.find((p) => p.id === pin.id);
              if (fullPin) handlePinPress(fullPin);
            }}
            style={styles.map}
          />
        )
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {/* Happening Now section */}
          {filters.time === 'all' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Happening Now</Text>
              {filteredEvents.filter((e) => timeFilterEvents([e], 'now').length > 0).length ===
              0 ? (
                <Text style={styles.emptySectionText}>No events starting soon</Text>
              ) : (
                filteredEvents
                  .filter((e) => timeFilterEvents([e], 'now').length > 0)
                  .slice(0, 3)
                  .map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.listCard}
                      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                    >
                      <View style={[styles.cardDot, { backgroundColor: '#4ade80' }]} />
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{event.title}</Text>
                        <Text style={styles.cardMeta}>
                          {new Date(event.startsAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          · {event.attendeeCount} going
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#333" />
                    </TouchableOpacity>
                  ))
              )}
            </View>
          )}

          {/* Active Beacons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Beacons ({filteredBeacons.length})</Text>
            {filteredBeacons.length === 0 ? (
              <Text style={styles.emptySectionText}>No beacons nearby</Text>
            ) : (
              filteredBeacons.slice(0, 5).map((beacon) => (
                <TouchableOpacity
                  key={beacon.id}
                  style={styles.listCard}
                  onPress={() => setSelectedBeacon(beacon)}
                >
                  <View style={[styles.cardDot, { backgroundColor: '#f59e0b' }]} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{beacon.message}</Text>
                    <Text style={styles.cardMeta}>
                      {beacon.creator.firstName} · {beacon.interestCount} interested
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#333" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events ({filteredEvents.length})</Text>
            {filteredEvents.length === 0 ? (
              <Text style={styles.emptySectionText}>No events found</Text>
            ) : (
              filteredEvents.slice(0, 10).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.listCard}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <View style={[styles.cardDot, { backgroundColor: '#4ade80' }]} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    <Text style={styles.cardMeta}>
                      {new Date(event.startsAt).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {event.attendeeCount} going
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#333" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Create FABs */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 16 }]}>
        {user && !user.isMinor && (
          <>
            <TouchableOpacity
              style={styles.fabSecondary}
              onPress={() => navigation.navigate('CreateBeacon')}
            >
              <Ionicons name="radio-button-on" size={20} color="#f59e0b" />
              <Text style={styles.fabSecondaryText}>Beacon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabPrimary}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <Ionicons name="add" size={22} color="#0a0a0a" />
              <Text style={styles.fabPrimaryText}>Event</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Beacon detail modal */}
      {selectedBeacon && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedBeacon(null)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setSelectedBeacon(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalMessage}>{selectedBeacon.message}</Text>
              {selectedBeacon.activity && (
                <View style={styles.activityTag}>
                  <Text style={styles.activityTagText}>{selectedBeacon.activity}</Text>
                </View>
              )}
              {selectedBeacon.placeName && (
                <Text style={styles.modalPlace}>{selectedBeacon.placeName}</Text>
              )}
              <View style={styles.modalCreator}>
                <UserAvatar
                  firstName={selectedBeacon.creator.firstName}
                  photoUrl={selectedBeacon.creator.photoUrl}
                  size={24}
                />
                <Text style={styles.modalCreatorName}>{selectedBeacon.creator.firstName}</Text>
                <Text style={styles.modalInterestCount}>
                  {selectedBeacon.interestCount} interested
                </Text>
              </View>

              {selectedBeacon.creatorId !== user?.id && (
                <TouchableOpacity
                  style={[
                    styles.interestButton,
                    selectedBeacon.hasExpressedInterest && styles.interestButtonDone,
                  ]}
                  onPress={() => handleBeaconInterest(selectedBeacon)}
                  disabled={selectedBeacon.hasExpressedInterest}
                >
                  <Ionicons
                    name={
                      selectedBeacon.hasExpressedInterest ? 'checkmark-circle' : 'heart-outline'
                    }
                    size={20}
                    color={selectedBeacon.hasExpressedInterest ? '#888' : '#0a0a0a'}
                  />
                  <Text
                    style={[
                      styles.interestText,
                      selectedBeacon.hasExpressedInterest && styles.interestTextDone,
                    ]}
                  >
                    {selectedBeacon.hasExpressedInterest ? "You're interested" : "I'm interested"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setSelectedEvent(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
              <Text style={styles.modalTime}>
                {new Date(selectedEvent.startsAt).toLocaleDateString([], {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(selectedEvent.startsAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <View style={styles.modalMeta}>
                <View style={styles.modalMetaItem}>
                  <Ionicons name="people-outline" size={16} color="#888" />
                  <Text style={styles.modalMetaText}>{selectedEvent.attendeeCount} going</Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <Ionicons name="location-outline" size={16} color="#888" />
                  <Text style={styles.modalMetaText}>
                    {(selectedEvent.distance / 1609.34).toFixed(1)} mi away
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewEventButton}
                onPress={() => {
                  setSelectedEvent(null);
                  navigation.navigate('EventDetail', { eventId: selectedEvent.id });
                }}
              >
                <Text style={styles.viewEventText}>View Event</Text>
                <Ionicons name="arrow-forward" size={16} color="#0a0a0a" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#4ade80" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { color: '#555', marginTop: 12, fontSize: 14 },
  errorText: { color: '#f87171', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Header
  header: { backgroundColor: '#0a0a0a', zIndex: 10 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#0a0a0a' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4 },
  toggleBtn: {
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: { backgroundColor: '#4ade80' },
  profileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  // Filter panel
  filterPanel: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  filterLabel: { width: 60, fontSize: 12, color: '#555', fontWeight: '600' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#111',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  filterChipActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  filterChipText: { fontSize: 13, color: '#888' },
  filterChipTextActive: { color: '#0a0a0a', fontWeight: '600' },

  // Map
  map: { flex: 1 },

  // List view
  listContainer: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptySectionText: { fontSize: 14, color: '#444', fontStyle: 'italic' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  cardDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#666' },

  // FABs
  fabContainer: { position: 'absolute', right: 16, flexDirection: 'row', gap: 8 },
  fabPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPrimaryText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a1a',
  },
  fabSecondaryText: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalMessage: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  modalTime: { fontSize: 14, color: '#888', marginBottom: 12 },
  modalMeta: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalMetaText: { fontSize: 13, color: '#888' },
  activityTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  activityTagText: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },
  modalPlace: { fontSize: 14, color: '#666', marginBottom: 8 },
  modalCreator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  modalCreatorName: { fontSize: 14, color: '#fff', fontWeight: '600' },
  modalInterestCount: { fontSize: 13, color: '#666', marginLeft: 'auto' },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  interestButtonDone: { backgroundColor: '#2a2a2a' },
  interestText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  interestTextDone: { color: '#888' },
  viewEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  viewEventText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },

  loadingOverlay: { position: 'absolute', top: 16, right: 16 },
});
