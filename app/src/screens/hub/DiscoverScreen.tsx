import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchPeople = async () => {
    if (location.loading || location.error) return;
    try {
      const { data } = await api.get('/discover/people', {
        params: { lat: location.latitude, lng: location.longitude },
      });
      setPeople(data.people);
    } catch {}
  };

  useEffect(() => {
    if (location.loading || location.error) return;
    fetchPeople().finally(() => setLoading(false));
  }, [location.loading, location.latitude, location.longitude]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPeople();
    setRefreshing(false);
  };

  if (location.loading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Finding people nearby...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ade80" />}
        ListHeaderComponent={
          people.length > 0 ? (
            <Text style={styles.headerText}>{people.length} people nearby with shared interests</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="compass-outline" size={40} color="#4ade80" />
            </View>
            <Text style={styles.emptyTitle}>No one nearby yet</Text>
            <Text style={styles.emptyText}>
              As more people join Disconnect in your area, you'll see people with shared interests here.
            </Text>
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
              activeOpacity={0.7}
            >
              <UserAvatar firstName={item.firstName} photoUrl={item.photoUrl} size={48} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.firstName}</Text>
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location-outline" size={11} color="#888" />
                    <Text style={styles.distance}>{distanceMiles} mi</Text>
                  </View>
                </View>
                {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
                {sharedLabels.length > 0 && (
                  <View style={styles.shared}>
                    {sharedLabels.slice(0, 4).map((label) => (
                      <View key={label} style={styles.sharedChip}>
                        <Text style={styles.sharedText}>{label}</Text>
                      </View>
                    ))}
                    {sharedLabels.length > 4 && (
                      <Text style={styles.moreChip}>+{sharedLabels.length - 4}</Text>
                    )}
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#333" style={{ alignSelf: 'center' }} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#555' },
  list: { padding: 16, paddingBottom: 32 },
  headerText: { fontSize: 13, color: '#555', marginBottom: 14, fontWeight: '500' },
  empty: { justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#0a2a0a',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ccc', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 21 },
  card: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a', gap: 12,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distance: { fontSize: 11, color: '#888' },
  bio: { fontSize: 13, color: '#777', marginTop: 3, lineHeight: 18 },
  shared: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sharedChip: { backgroundColor: '#0a2a0a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sharedText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },
  moreChip: { fontSize: 11, color: '#555', fontWeight: '600', alignSelf: 'center' },
});
