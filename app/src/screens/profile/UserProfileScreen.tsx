import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../../components/UserAvatar';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { INTERESTS } from '../../constants/interests';
import ReportButton from '../../components/ReportButton';

interface UserProfile {
  id: string;
  firstName: string;
  bio: string | null;
  interests: string[];
  photoUrl: string | null;
  isMinor: boolean;
}

interface ProfileStats {
  eventsAttended: number;
  challengesCompleted: number;
  currentStreak: number;
}

export default function UserProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { userId } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/users/${userId}`);
        setProfile(data.user);
        if (data.stats) setStats(data.stats);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  const interestLabels = profile.interests
    .map((id) => INTERESTS.find((i) => i.id === id)?.label)
    .filter(Boolean);

  const isMe = currentUser?.id === profile.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <UserAvatar firstName={profile.firstName} photoUrl={profile.photoUrl} size={80} />
      <Text style={styles.name}>{profile.firstName}</Text>
      {profile.isMinor && <Text style={styles.ageBadge}>Under 18</Text>}
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {/* Interests */}
      <View style={styles.interests}>
        {interestLabels.map((label) => (
          <View key={label} style={styles.chip}>
            <Text style={styles.chipText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.eventsAttended}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.challengesCompleted}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Week streak</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      {!isMe && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={async () => {
              await api.post('/blocks', { userId: profile.id });
              navigation.goBack();
            }}
          >
            <Ionicons name="ban-outline" size={16} color="#f87171" />
            <Text style={styles.blockText}>Block</Text>
          </TouchableOpacity>
          <ReportButton targetType="user" targetId={profile.id} reportedUserId={profile.id} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 12 },
  ageBadge: {
    fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 4,
    backgroundColor: '#2a2000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  bio: { fontSize: 15, color: '#aaa', textAlign: 'center', marginTop: 8 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
  },
  chipText: { fontSize: 13, color: '#ccc' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginTop: 24,
    borderWidth: 1, borderColor: '#262626',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#4ade80' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 32 },
  blockButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#f87171',
  },
  blockText: { fontSize: 13, color: '#f87171', fontWeight: '600' },
});
