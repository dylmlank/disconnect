import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HUB_ITEMS = [
  { label: 'Circles', icon: 'people-outline' as const, screen: 'Circles', color: '#4ade80' },
  { label: 'Habits', icon: 'leaf-outline' as const, screen: 'Habits', color: '#4ade80' },
  { label: 'Challenges', icon: 'trophy-outline' as const, screen: 'Challenges', color: '#f59e0b' },
  { label: 'Check In', icon: 'heart-outline' as const, screen: 'CheckIn', color: '#4ade80' },
  { label: 'Focus', icon: 'timer-outline' as const, screen: 'Focus', color: '#60a5fa' },
];

export default function HubScreen({ navigation }: { navigation: any }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hub</Text>
      <Text style={styles.subtitle}>Your daily wellness dashboard</Text>

      <View style={styles.grid}>
        {HUB_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.75}
          >
            <Ionicons name={item.icon} size={32} color={item.color} />
            <Text style={[styles.cardLabel, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 28 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#262626',
    minHeight: 110,
  },
  cardLabel: { fontSize: 15, fontWeight: '700' },
});
