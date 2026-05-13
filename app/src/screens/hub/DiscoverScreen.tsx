import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../hooks/useLocation';
import UserAvatar from '../../components/UserAvatar';
import { INTERESTS } from '../../constants/interests';
import api from '../../services/api';

interface DiscoverPerson {
  id: string;
  firstName: string;
  bio: string | null;
  interests: string[];
  photoUrl: string | null;
  sharedInterests: string[];
  distance: number;
}

export default function DiscoverScreen({ navigation }: { navigation: any }) {
  const location = useLocation();
  const [people, setPeople] = useState<DiscoverPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.loading || location.error) return;
    api.get('/discover/people', { params: { lat: location.latitude, lng: location.longitude } })
      .then(({ data }) => setPeople(data.people))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location.loading, location.latitude, location.longitude]);

  if (location.loading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No one nearby yet</Text>
            <Text style={styles.emptyText}>As more people join Disconnect in your area, you'll see people with shared interests here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const distanceMiles = (item.distance / 1609.34).toFixed(1);
          const sharedLabels = item.sharedInterests
            .map((id) => INTERESTS.find((i) => i.id === id)?.label)
            .filter(Boolean);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
            >
              <UserAvatar firstName={item.firstName} photoUrl={item.photoUrl} size={44} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.firstName}</Text>
                  <Text style={styles.distance}>{distanceMiles} mi</Text>
                </View>
                {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
                <View style={styles.shared}>
                  {sharedLabels.map((label) => (
                    <View key={label} style={styles.sharedChip}>
                      <Text style={styles.sharedText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#262626',
  },
  cardContent: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  distance: { fontSize: 12, color: '#888' },
  bio: { fontSize: 13, color: '#888', marginTop: 2 },
  shared: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sharedChip: { backgroundColor: '#0a2a0a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sharedText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },
});
