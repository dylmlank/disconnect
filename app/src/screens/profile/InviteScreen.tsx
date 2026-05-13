import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const INVITE_LINK = 'https://disconnect.app';

export default function InviteScreen() {
  const handleShare = async () => {
    await Share.share({
      message: `Join me on Disconnect — the app designed to get you off your phone and into the world. Less screen, more life.\n\n${INVITE_LINK}`,
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(INVITE_LINK);
    Alert.alert('Copied!', 'Invite link copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={64} color="#4ade80" />
      <Text style={styles.title}>Invite Friends</Text>
      <Text style={styles.subtitle}>
        Disconnect is better with friends. Invite people to join your circles, challenges, and focus sessions.
      </Text>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="#0a0a0a" />
        <Text style={styles.shareText}>Share Invite Link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Ionicons name="copy-outline" size={20} color="#4ade80" />
        <Text style={styles.copyText}>Copy Link</Text>
      </TouchableOpacity>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Tips for getting started</Text>
        <View style={styles.tip}>
          <Text style={styles.tipEmoji}>👥</Text>
          <Text style={styles.tipText}>Create a Circle with 2-7 close friends</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipEmoji}>🏆</Text>
          <Text style={styles.tipText}>Start a challenge together (try Phone-Free Mornings)</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipEmoji}>🎯</Text>
          <Text style={styles.tipText}>Do focus sessions together — accountability works</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipEmoji}>📅</Text>
          <Text style={styles.tipText}>Create an event and invite people in person</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, alignItems: 'center', paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 320 },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#4ade80', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32,
    width: '100%', justifyContent: 'center',
  },
  shareText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  copyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32,
    width: '100%', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: '#4ade80',
  },
  copyText: { fontSize: 16, fontWeight: '700', color: '#4ade80' },
  tips: { marginTop: 40, width: '100%' },
  tipsTitle: { fontSize: 16, fontWeight: '700', color: '#666', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  tipEmoji: { fontSize: 20 },
  tipText: { fontSize: 14, color: '#ccc', flex: 1 },
});
