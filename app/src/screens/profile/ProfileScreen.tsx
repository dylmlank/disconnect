import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useScreenTime } from '../../hooks/useScreenTime';
import { useThemeStore, themes } from '../../store/themeStore';
import { INTERESTS } from '../../constants/interests';
import ProgressRing from '../../components/ProgressRing';
import api from '../../services/api';
import { API_URL } from '../../constants/config';

interface UserStats {
  eventsThisMonth: number;
  eventsAllTime: number;
  weeklyStreak: number;
  beaconsDropped: number;
}

interface LevelInfo {
  xp: number;
  level: number;
  levelName: string;
  emoji: string;
  progressPercent: number;
  nextLevelXp: number | null;
}

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { weeklyMinutes } = useScreenTime();
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

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
    api.get('/users/me/level').then(({ data }) => {
      const l = data.level;
      if (l?.current) {
        setLevelInfo({
          xp: l.xp,
          level: l.current.level,
          levelName: l.current.name,
          emoji: l.current.emoji,
          progressPercent: l.progressPercent,
          nextLevelXp: l.next?.xpRequired ?? null,
        });
      }
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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
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

      <Text style={[styles.name, { color: colors.text }]}>{user.firstName}</Text>
      {user.isMinor && <Text style={styles.ageBadge}>Under 18</Text>}

      {/* Level + XP ring */}
      {levelInfo && (
        <View style={styles.levelBlock}>
          <ProgressRing
            size={72}
            strokeWidth={4}
            progress={levelInfo.progressPercent / 100}
            color="#4ade80"
          >
            <Text style={styles.levelNumInRing}>{levelInfo.level}</Text>
          </ProgressRing>
          <Text style={styles.levelText}>
            {levelInfo.emoji} {levelInfo.levelName}
          </Text>
          {levelInfo.nextLevelXp !== null && (
            <Text style={styles.xpSubtext}>{levelInfo.xp} / {levelInfo.nextLevelXp} XP</Text>
          )}
        </View>
      )}

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

      {/* Actions Grid */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="pencil-outline" size={20} color="#4ade80" />
          <Text style={styles.gridLabel}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Badges')}>
          <Ionicons name="ribbon-outline" size={20} color="#f59e0b" />
          <Text style={styles.gridLabel}>Badges</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('MoodTrends')}>
          <Ionicons name="analytics-outline" size={20} color="#a78bfa" />
          <Text style={styles.gridLabel}>Mood Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WeeklyRecap')}>
          <Ionicons name="calendar-outline" size={20} color="#60a5fa" />
          <Text style={styles.gridLabel}>Weekly Recap</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.actionButton, styles.inviteButton]} onPress={() => navigation.navigate('Invite')}>
        <Ionicons name="people-outline" size={18} color="#4ade80" />
        <Text style={[styles.actionText, { color: '#4ade80' }]}>Invite Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={18} color="#888" />
        <Text style={styles.actionText}>Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', marginTop: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: '#262626',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#4ade80' },
  photoHint: { fontSize: 11, color: '#555', textAlign: 'center', marginTop: 6 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 12 },
  ageBadge: {
    fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 4,
    backgroundColor: '#2a2000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  levelBlock: { alignItems: 'center', width: '100%', marginTop: 16, marginBottom: 4, gap: 6 },
  levelNumInRing: { fontSize: 20, fontWeight: '800', color: '#4ade80' },
  levelText: { fontSize: 14, fontWeight: '700', color: '#aaa' },
  xpSubtext: { fontSize: 11, color: '#555' },
  bio: { fontSize: 15, color: '#aaa', textAlign: 'center', marginTop: 8 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#262626',
  },
  chipText: { fontSize: 13, color: '#ccc' },
  screenTimeLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  screenTimeValue: { fontSize: 26, fontWeight: '800', color: '#4ade80', marginVertical: 4 },
  screenTimeSubtext: { fontSize: 12, color: '#555' },
  timeCards: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 24 },
  timeCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a',
  },
  timeUnit: { fontSize: 14, fontWeight: '600' },
  statsCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20, width: '100%',
    marginTop: 12, borderWidth: 1, borderColor: '#1a1a1a',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  streakValue: { color: '#f59e0b' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakMessage: { fontSize: 13, color: '#f59e0b', textAlign: 'center', marginTop: 12 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 24,
  },
  gridItem: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  gridLabel: { fontSize: 13, fontWeight: '600', color: '#ccc' },
  actionButton: {
    width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#111',
    marginTop: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#ccc' },
  inviteButton: { borderColor: '#1a3a1a', backgroundColor: '#0d1a0d' },
});
