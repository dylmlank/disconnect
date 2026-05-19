import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useChallengeStore } from '../../store/challengeStore';
import { CHALLENGE_TEMPLATES } from '@disconnect/shared';
import ChallengeCard from '../../components/ChallengeCard';
import type { Challenge } from '@disconnect/shared';

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const { challenges, myChallenges, isLoading, fetchChallenges } = useChallengeStore();
  const [tab, setTab] = useState<'public' | 'mine'>('public');
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, [tab]);

  async function loadChallenges() {
    if (tab === 'mine') {
      await fetchChallenges('mine');
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        return;
      }
      setLocationError(false);
      const loc = await Location.getCurrentPositionAsync({});
      await fetchChallenges('public', loc.coords.latitude, loc.coords.longitude);
    } catch {
      setLocationError(true);
    }
  }

  const data: Challenge[] = tab === 'public' ? challenges : myChallenges;

  // Pick a featured template based on the day
  const dayIndex = new Date().getDate() % CHALLENGE_TEMPLATES.length;
  const featured = CHALLENGE_TEMPLATES[dayIndex];

  return (
    <View style={styles.container}>
      {/* Toggle tabs */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'public' && styles.toggleBtnActive]}
          onPress={() => setTab('public')}
        >
          <Text style={[styles.toggleText, tab === 'public' && styles.toggleTextActive]}>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'mine' && styles.toggleBtnActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.toggleText, tab === 'mine' && styles.toggleTextActive]}>Mine</Text>
        </TouchableOpacity>
      </View>

      {isLoading && data.length === 0 ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
      ) : locationError && tab === 'public' ? (
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={48} color="#333" />
          <Text style={styles.emptyTitle}>Location Required</Text>
          <Text style={styles.emptyText}>Enable location to browse public challenges near you.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadChallenges}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={48} color="#333" />
          <Text style={styles.emptyTitle}>{tab === 'public' ? 'No nearby challenges' : 'No challenges yet'}</Text>
          <Text style={styles.emptyText}>
            {tab === 'public'
              ? 'Be the first to create a public challenge in your area!'
              : 'Join or create a challenge to get started.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            tab === 'public' && myChallenges.length === 0 ? (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => navigation.navigate('CreateChallenge', { templateId: featured.id })}
                activeOpacity={0.8}
              >
                <View style={styles.featuredBadge}>
                  <Ionicons name="sparkles" size={12} color="#f59e0b" />
                  <Text style={styles.featuredBadgeText}>Suggested</Text>
                </View>
                <Text style={styles.featuredTitle}>{featured.title}</Text>
                <Text style={styles.featuredDesc}>{featured.description}</Text>
                <Text style={styles.featuredDuration}>{featured.durationDays} days · tap to start</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
            />
          )}
          onRefresh={loadChallenges}
          refreshing={isLoading}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateChallenge')}>
        <Ionicons name="add" size={28} color="#0a0a0a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  toggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#f59e0b' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#666' },
  toggleTextActive: { color: '#0a0a0a' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  featuredCard: {
    backgroundColor: '#1a1a0a', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#3a3a0a',
  },
  featuredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' },
  featuredTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  featuredDesc: { fontSize: 13, color: '#aaa', lineHeight: 19, marginBottom: 8 },
  featuredDuration: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  retryText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
