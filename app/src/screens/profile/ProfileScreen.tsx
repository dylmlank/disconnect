import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useScreenTime } from '../../hooks/useScreenTime';
import { INTERESTS } from '../../constants/interests';
import api from '../../services/api';
import { API_URL } from '../../constants/config';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { weeklyMinutes } = useScreenTime();
  const [uploading, setUploading] = useState(false);

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

  const handleLogout = () => {
    setUser(null);
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

      {/* Screen time badge */}
      <View style={styles.screenTimeCard}>
        <Text style={styles.screenTimeLabel}>Weekly screen time</Text>
        <Text style={styles.screenTimeValue}>{weeklyMinutes} min</Text>
        <Text style={styles.screenTimeSubtext}>
          {weeklyMinutes < 30 ? "Amazing! You're barely here." : weeklyMinutes < 120 ? 'Great balance.' : 'Maybe go outside? :)'}
        </Text>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.actionText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('BlockedUsers')}>
        <Text style={styles.actionText}>Blocked Users</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
        <Text style={[styles.actionText, styles.logoutText]}>Log Out</Text>
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
  screenTimeCard: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, alignItems: 'center',
    width: '100%', marginTop: 24, borderWidth: 1, borderColor: '#262626',
  },
  screenTimeLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  screenTimeValue: { fontSize: 36, fontWeight: '800', color: '#4ade80', marginVertical: 4 },
  screenTimeSubtext: { fontSize: 13, color: '#666' },
  actionButton: {
    width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#1a1a1a',
    marginTop: 12, alignItems: 'center',
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  logoutButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f87171', marginTop: 24 },
  logoutText: { color: '#f87171' },
});
