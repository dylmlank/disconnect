import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCircleStore } from '../../store/circleStore';
import { useAuthStore } from '../../store/authStore';
import UserAvatar from '../../components/UserAvatar';
import CircleFeedItemComponent from '../../components/CircleFeedItem';

export default function CircleDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { circleId } = route.params;
  const { currentCircle, feed, isLoading, fetchCircle, fetchFeed, leaveCircle } = useCircleStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchCircle(circleId);
    fetchFeed(circleId);
  }, [circleId]);

  const handleShare = async () => {
    if (!currentCircle) return;
    await Share.share({ message: `Join my circle "${currentCircle.name}" on Disconnect! Code: ${currentCircle.inviteCode}` });
  };

  const handleLeave = () => {
    const isCreator = currentCircle?.creatorId === user?.id;
    Alert.alert(
      isCreator ? 'Delete Circle' : 'Leave Circle',
      isCreator ? 'This will delete the circle for everyone.' : 'You can rejoin later with the invite code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCreator ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveCircle(circleId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (isLoading || !currentCircle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{currentCircle.name}</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeLabel}>Invite code: </Text>
          <Text style={styles.code}>{currentCircle.inviteCode}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={18} color="#4ade80" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members */}
      <View style={styles.membersRow}>
        {currentCircle.members.map((m) => (
          <View key={m.userId} style={styles.memberChip}>
            <UserAvatar firstName={m.firstName} photoUrl={m.photoUrl} size={28} />
            <Text style={styles.memberName}>{m.firstName}</Text>
          </View>
        ))}
      </View>

      {/* Feed */}
      {feed.length === 0 ? (
        <View style={styles.emptyFeed}>
          <Ionicons name="pulse-outline" size={40} color="#333" />
          <Text style={styles.emptyFeedText}>No activity in the last 24 hours</Text>
          <Text style={styles.emptyFeedSubtext}>Log a habit, check in, or start a focus session!</Text>
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CircleFeedItemComponent item={item} />}
          style={styles.feed}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Leave button */}
      <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveText}>
          {currentCircle.creatorId === user?.id ? 'Delete Circle' : 'Leave Circle'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingBottom: 12 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff' },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  codeLabel: { fontSize: 13, color: '#888' },
  code: { fontSize: 13, fontWeight: '700', color: '#4ade80', fontFamily: 'monospace' },
  shareButton: { marginLeft: 8, padding: 4 },
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingRight: 12, paddingLeft: 4, paddingVertical: 4, gap: 6 },
  memberName: { fontSize: 13, color: '#ccc' },
  feed: { flex: 1, borderTopWidth: 1, borderTopColor: '#262626' },
  emptyFeed: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyFeedText: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 12 },
  emptyFeedSubtext: { fontSize: 13, color: '#444', marginTop: 4, textAlign: 'center' },
  leaveButton: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#262626' },
  leaveText: { fontSize: 14, color: '#f87171', fontWeight: '600' },
});
