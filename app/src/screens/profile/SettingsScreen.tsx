import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { signOut } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [challengeReminders, setChallengeReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [circleActivity, setCircleActivity] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your data, and cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm Deletion', 'Type "delete" to confirm.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await api.delete('/users/me');
                    await signOut();
                    setUser(null);
                  } catch {
                    Alert.alert('Error', 'Failed to delete account. Please contact support.');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Event reminders</Text>
          <Switch value={eventReminders} onValueChange={setEventReminders} trackColor={{ true: '#4ade80' }} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Challenge reminders</Text>
          <Switch value={challengeReminders} onValueChange={setChallengeReminders} trackColor={{ true: '#4ade80' }} />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingLabel}>Circle activity</Text>
          <Switch value={circleActivity} onValueChange={setCircleActivity} trackColor={{ true: '#4ade80' }} />
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={16} color="#888" />
        </TouchableOpacity>
        <View style={[styles.linkRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.linkText}>Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('BlockedUsers')}>
          <Text style={styles.linkText}>Blocked Users</Text>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <Text style={[styles.linkText, { color: '#f87171' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={18} color="#f87171" />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Disconnect — the app you open to close your phone.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 8 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#262626', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  settingLabel: { fontSize: 15, color: '#fff' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  linkText: { fontSize: 15, color: '#fff' },
  versionText: { fontSize: 14, color: '#888' },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 32, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f87171',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#f87171' },
  footer: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 32 },
});
