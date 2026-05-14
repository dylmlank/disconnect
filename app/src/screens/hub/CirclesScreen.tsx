import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCircleStore } from '../../store/circleStore';

export default function CirclesScreen({ navigation }: { navigation: any }) {
  const { circles, isLoading, fetchCircles } = useCircleStore();

  useEffect(() => {
    fetchCircles();
  }, []);

  return (
    <View style={styles.container}>
      {/* Discover People shortcut */}
      <TouchableOpacity style={styles.discoverBanner} onPress={() => navigation.navigate('Discover')} activeOpacity={0.8}>
        <View style={styles.discoverIcon}>
          <Ionicons name="compass" size={20} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.discoverTitle}>Discover People</Text>
          <Text style={styles.discoverSub}>Find people nearby with shared interests</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#444" />
      </TouchableOpacity>

      {isLoading && circles.length === 0 ? (
        <ActivityIndicator size="large" color="#4ade80" style={{ marginTop: 40 }} />
      ) : circles.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color="#333" />
          <Text style={styles.emptyTitle}>No circles yet</Text>
          <Text style={styles.emptyText}>Create a circle or join one with an invite code.</Text>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CircleDetail', { circleId: item.id, circleName: item.name })}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="people" size={22} color="#4ade80" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.memberCount} members</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateCircle')}>
          <Ionicons name="add" size={20} color="#0a0a0a" />
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('JoinCircle')}>
          <Ionicons name="enter-outline" size={20} color="#4ade80" />
          <Text style={styles.joinText}>Join Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  discoverBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginBottom: 8,
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1a1a0a',
  },
  discoverIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#1a1a0a',
    justifyContent: 'center', alignItems: 'center',
  },
  discoverTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  discoverSub: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  list: { padding: 16, paddingTop: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a',
  },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#0a2a0a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  actions: { flexDirection: 'row', padding: 16, gap: 10, paddingBottom: 24 },
  createButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4ade80', borderRadius: 12, padding: 14, gap: 6 },
  createText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  joinButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1a0d', borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: '#1a3a1a' },
  joinText: { fontSize: 14, fontWeight: '700', color: '#4ade80' },
});
