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
                <Ionicons name="people" size={24} color="#4ade80" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.memberCount} members</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateCircle')}>
          <Ionicons name="add" size={20} color="#0a0a0a" />
          <Text style={styles.createText}>Create Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('JoinCircle')}>
          <Ionicons name="enter-outline" size={20} color="#4ade80" />
          <Text style={styles.joinText}>Join Circle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#262626',
  },
  cardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0a2a0a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  createButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4ade80', borderRadius: 12, padding: 14, gap: 8 },
  createText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  joinButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#4ade80' },
  joinText: { fontSize: 14, fontWeight: '700', color: '#4ade80' },
});
