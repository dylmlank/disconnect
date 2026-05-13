import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useScreenTime } from '../../hooks/useScreenTime';
import { INTERESTS } from '../../constants/interests';
import api from '../../services/api';
import { API_URL } from '../../constants/config';

interface UserStats {
  eventsThisMonth: number;
  eventsAllTime: number;
  weeklyStreak: number;
  beaconsDropped: number;
}

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { weeklyMinutes } = useScreenTime();
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    api.get('/users/me/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
    api.get('/focus/history', { params: { limit: 100 } }).then(({ data }) => {
      const thisWeek = data.sessions?.filter((s: any) => {
        const d = new Date(s.startedAt);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo && s.completed;
      }) || [];
      setFocusMinutes(thisWeek.reduce((sum: number, s: any) => sum + s.durationMinutes, 0));
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const interestLabels = user.interests
    .map((id) => INTERESTS.find((i) => i.id === id)?.label)
    .filter(Boolean);

  const photoUri = user.photoUrl
    ? user.photoUrl.startsWith('http') ? user.photoUrl : `${API_URL.replace('/api', '')}${user.photoUrl}`
    : null;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('photo', blob, 'photo.jpg');
      } else {
        formData.append('photo', {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }

      const { data } = await api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser({ ...user, photoUrl: data.photoUrl });
    } catch {
      Alert.alert('Error', 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar — tap to change photo */}
      <TouchableOpacity onPress={handlePickPhoto} disabled={uploading}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.firstName[0]}</Text>
          </View>
        )}
        <Text style={styles.photoHint}>{uploading ? 'Uploading...' : 'Tap to change'}</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{user.firstName}</Text>
      {user.isMinor && <Text style={styles.ageBadge}>Under 18</Text>}
      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

      {/* Interests */}
      <View style={styles.interests}>
        {interestLabels.map((label) => (
          <View key={label} style={styles.chip}>
            <Text style={styles.chipText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Screen time + Focus time */}
      <View style={styles.timeCards}>
        <View style={styles.timeCard}>
          <Text style={styles.screenTimeLabel}>Screen time</Text>
          <Text style={styles.screenTimeValue}>{weeklyMinutes}<Text style={styles.timeUnit}> min</Text></Text>
          <Text style={styles.screenTimeSubtext}>
            {weeklyMinutes < 30 ? "Barely here 🎉" : weeklyMinutes < 120 ? 'Good balance' : 'Go outside :)'}
          </Text>
        </View>
        <View style={styles.timeCard}>
          <Text style={styles.screenTimeLabel}>Focus time</Text>
          <Text style={[styles.screenTimeValue, { color: '#60a5fa' }]}>{focusMinutes}<Text style={styles.timeUnit}> min</Text></Text>
          <Text style={styles.screenTimeSubtext}>
            {focusMinutes === 0 ? 'Start a session' : focusMinutes >= 300 ? 'Deep worker 🎯' : 'Keep going'}
          </Text>
        </View>
      </View>

      {/* Stats card */}
      {stats && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.eventsThisMonth}</Text>
              <Text style={styles.statLabel}>This month</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.eventsAllTime}</Text>
              <Text style={styles.statLabel}>All time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.streakValue]}>{stats.weeklyStreak}</Text>
              <Text style={styles.statLabel}>Week streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.beaconsDropped}</Text>
              <Text style={styles.statLabel}>Beacons</Text>
            </View>
          </View>
          {stats.weeklyStreak > 0 && (
            <Text style={styles.streakMessage}>
              {stats.weeklyStreak >= 4 ? "You're on fire! Keep going outside." : `${stats.weeklyStreak} week streak — nice!`}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.actionText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.inviteButton]} onPress={() => navigation.navigate('Invite')}>
        <Text style={[styles.actionText, { color: '#4ade80' }]}>Invite Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.actionText}>Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center', marginTop: 24, overflow: 'hidden',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#4ade80' },
  photoHint: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6 },
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
  screenTimeLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  screenTimeValue: { fontSize: 28, fontWeight: '800', color: '#4ade80', marginVertical: 4 },
  screenTimeSubtext: { fontSize: 13, color: '#666' },
  timeCards: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 24 },
  timeCard: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#262626',
  },
  timeUnit: { fontSize: 14, fontWeight: '600' },
  statsCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, width: '100%',
    marginTop: 12, borderWidth: 1, borderColor: '#262626',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  streakValue: { color: '#f59e0b' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase' },
  streakMessage: { fontSize: 13, color: '#f59e0b', textAlign: 'center', marginTop: 12 },
  actionButton: {
    width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#1a1a1a',
    marginTop: 12, alignItems: 'center',
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  inviteButton: { borderWidth: 1, borderColor: '#4ade80', backgroundColor: '#0a2a0a' },
});
