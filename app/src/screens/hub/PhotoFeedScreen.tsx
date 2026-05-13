import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_URL } from '../../constants/config';

const { width } = Dimensions.get('window');
const COL_GAP = 8;
const PADDING = 16;
const COL_WIDTH = (width - PADDING * 2 - COL_GAP) / 2;

interface PhotoItem {
  id: string;
  photoUrl: string;
  loggedAt: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  sourceName: string;
  sourceType: 'challenge' | 'habit';
}

function resolveUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL.replace('/api', '')}${url}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Split into 2 columns (masonry-ish: alternate assignment)
function splitColumns(items: PhotoItem[]): [PhotoItem[], PhotoItem[]] {
  const left: PhotoItem[] = [];
  const right: PhotoItem[] = [];
  items.forEach((item, i) => {
    if (i % 2 === 0) left.push(item);
    else right.push(item);
  });
  return [left, right];
}

function PhotoCard({ item }: { item: PhotoItem }) {
  const photoUri = resolveUrl(item.photoUrl);
  const avatarUri = item.userPhoto ? resolveUrl(item.userPhoto) : null;
  // Alternate aspect ratio for visual interest
  const aspectRatio = item.id.charCodeAt(0) % 2 === 0 ? 1 : 1.3;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: photoUri }}
        style={[styles.cardImage, { aspectRatio }]}
        resizeMode="cover"
      />
      <View style={styles.cardFooter}>
        <View style={styles.cardUser}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.cardAvatar} />
          ) : (
            <View style={styles.cardAvatarPlaceholder}>
              <Text style={styles.cardAvatarText}>{item.userName[0]}</Text>
            </View>
          )}
          <View style={styles.cardUserInfo}>
            <Text style={styles.cardUserName} numberOfLines={1}>{item.userName}</Text>
            <Text style={styles.cardSource} numberOfLines={1}>{item.sourceName}</Text>
          </View>
        </View>
        <Text style={styles.cardTime}>{timeAgo(item.loggedAt)}</Text>
      </View>
    </View>
  );
}

export default function PhotoFeedScreen() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = useCallback(async () => {
    try {
      const { data } = await api.get('/feed/photos');
      setPhotos(data.photos ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPhotos().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  const [left, right] = splitColumns(photos);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[1]} // single row, we render columns inside
      keyExtractor={() => 'grid'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ade80" />
      }
      ListHeaderComponent={
        <>
          <Text style={styles.heading}>Proof Feed</Text>
          <Text style={styles.subheading}>Photos from your circles — last 7 days</Text>
        </>
      }
      renderItem={() => {
        if (photos.length === 0) {
          return (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Log habits or challenges with a photo to see them here
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.grid}>
            {/* Left column */}
            <View style={styles.column}>
              {left.map((item) => (
                <PhotoCard key={item.id} item={item} />
              ))}
            </View>

            {/* Right column */}
            <View style={styles.column}>
              {right.map((item) => (
                <PhotoCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: PADDING, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },

  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subheading: { fontSize: 13, color: '#555', marginBottom: 20 },

  grid: { flexDirection: 'row', gap: COL_GAP },
  column: { flex: 1, gap: COL_GAP },

  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cardImage: { width: '100%' },
  cardFooter: {
    padding: 10,
    gap: 6,
  },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardAvatar: { width: 22, height: 22, borderRadius: 11 },
  cardAvatarPlaceholder: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontSize: 10, fontWeight: '700', color: '#4ade80' },
  cardUserInfo: { flex: 1 },
  cardUserName: { fontSize: 12, fontWeight: '700', color: '#ddd' },
  cardSource: { fontSize: 10, color: '#555', marginTop: 1 },
  cardTime: { fontSize: 10, color: '#444', alignSelf: 'flex-end' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  emptySubtext: { fontSize: 14, color: '#555', textAlign: 'center', paddingHorizontal: 20 },
});
