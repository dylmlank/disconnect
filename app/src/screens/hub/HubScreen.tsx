import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCircleStore } from '../../store/circleStore';
import { useEventStore } from '../../store/eventStore';
import { useBeaconStore } from '../../store/beaconStore';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useScreenTime } from '../../hooks/useScreenTime';
import UserAvatar from '../../components/UserAvatar';
import api from '../../services/api';

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export default function HubScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const { circles, fetchCircles } = useCircleStore();
  const { events, fetchEvents } = useEventStore();
  const { beacons, fetchBeacons } = useBeaconStore();
  const location = useLocation();
  const { sessionSeconds } = useScreenTime();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCircleCount, setUnreadCircleCount] = useState(0);
  const [upcomingEventCount, setUpcomingEventCount] = useState(0);

  const loadData = useCallback(async () => {
    const promises: Promise<void>[] = [];

    if (!location.loading && !location.error) {
      promises.push(fetchEvents(location.latitude, location.longitude));
      promises.push(fetchBeacons(location.latitude, location.longitude));
    }
    promises.push(fetchCircles());

    await Promise.all(promises);

    // Fetch unread counts
    try {
      const { data } = await api.get('/circles/unread');
      setUnreadCircleCount(data.unread ?? 0);
    } catch {}

    // Count upcoming events (next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = events.filter((e) => {
      const start = new Date(e.startsAt);
      return start >= now && start <= weekFromNow;
    });
    setUpcomingEventCount(upcoming.length);
  }, [location.loading, location.error, fetchEvents, fetchBeacons, fetchCircles]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return 'Just opened';
    if (mins === 1) return '1 minute in';
    return `${mins} minutes in`;
  };

  const quickActions: QuickAction[] = [
    {
      id: 'map',
      icon: 'map',
      label: 'View Map',
      color: '#4ade80',
      bgColor: '#0a2a0a',
      onPress: () => navigation.navigate('HomeTab'),
    },
    {
      id: 'event',
      icon: 'add-circle',
      label: 'Create Event',
      color: '#f59e0b',
      bgColor: '#2a1a0a',
      onPress: () => navigation.navigate('HomeTab', { screen: 'CreateEvent' }),
    },
    {
      id: 'beacon',
      icon: 'radio-button-on',
      label: 'Drop Beacon',
      color: '#60a5fa',
      bgColor: '#0a1a2a',
      onPress: () => navigation.navigate('HomeTab', { screen: 'CreateBeacon' }),
    },
    {
      id: 'circles',
      icon: 'people',
      label: 'Circles',
      color: '#a78bfa',
      bgColor: '#1a0a2a',
      onPress: () => navigation.navigate('SocialTab'),
    },
  ];

  const statsCards = [
    {
      label: 'Active Beacons',
      value: beacons.length,
      icon: 'radio-button-on' as const,
      color: '#f59e0b',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEventCount,
      icon: 'calendar' as const,
      color: '#4ade80',
    },
    { label: 'Your Circles', value: circles.length, icon: 'people' as const, color: '#a78bfa' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.skeleton} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ade80" />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.firstName || 'there'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <UserAvatar firstName={user?.firstName || ''} photoUrl={user?.photoUrl} size={40} />
          </TouchableOpacity>
        </View>

        {/* Session time nudge */}
        <View style={styles.sessionCard}>
          <Ionicons name="time-outline" size={18} color="#888" />
          <Text style={styles.sessionText}>{formatSessionTime(sessionSeconds)}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.sessionAction}>Stay mindful</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: action.bgColor }]}
              onPress={action.onPress}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsRow}>
          {statsCards.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Circle Activity */}
      {circles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Circles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SocialTab')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {circles.slice(0, 3).map((circle) => (
            <TouchableOpacity
              key={circle.id}
              style={styles.circleRow}
              onPress={() =>
                navigation.navigate('SocialTab', {
                  screen: 'CircleDetail',
                  params: { circleId: circle.id },
                })
              }
            >
              <View style={styles.circleIcon}>
                <Text style={styles.circleEmoji}>👥</Text>
              </View>
              <View style={styles.circleInfo}>
                <Text style={styles.circleName}>{circle.name}</Text>
                <Text style={styles.circleMembers}>{circle.memberCount} members</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#333" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Nearby Activity */}
      {beacons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Nearby</Text>
          <Text style={styles.nearbyCount}>
            {beacons.length} beacon{beacons.length !== 1 ? 's' : ''} nearby
          </Text>
          <TouchableOpacity
            style={styles.viewMapButton}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Ionicons name="map" size={18} color="#4ade80" />
            <Text style={styles.viewMapText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 14, color: '#666' },
  userName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  profileButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  // Session card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  sessionText: { fontSize: 14, color: '#888', flex: 1 },
  sessionAction: { fontSize: 13, color: '#4ade80', fontWeight: '600' },

  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: '#4ade80', fontWeight: '600' },

  // Quick actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48%', padding: 16, borderRadius: 16, alignItems: 'center', gap: 10 },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#555', marginTop: 2 },

  // Circles
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleEmoji: { fontSize: 18 },
  circleInfo: { flex: 1, marginLeft: 12 },
  circleName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  circleMembers: { fontSize: 12, color: '#555', marginTop: 1 },

  // Nearby
  nearbyCount: { fontSize: 14, color: '#888', marginBottom: 12 },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a2a0a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4ade80' + '40',
  },
  viewMapText: { fontSize: 14, fontWeight: '600', color: '#4ade80' },

  // Skeleton
  skeleton: { width: 200, height: 30, borderRadius: 8, backgroundColor: '#1a1a1a' },
});
