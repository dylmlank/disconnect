import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCircleStore } from '../../store/circleStore';
import { useAuthStore } from '../../store/authStore';
import { useNudgeStore } from '../../store/nudgeStore';
import UserAvatar from '../../components/UserAvatar';
import CircleFeedItemComponent from '../../components/CircleFeedItem';
import { hapticTap } from '../../utils/haptics';

export default function CircleDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { circleId } = route.params;
  const { currentCircle, groupStreak, feed, isLoading, fetchCircle, fetchFeed, leaveCircle } = useCircleStore();
  const user = useAuthStore((s) => s.user);
  const { circleActivity, fetchCircleActivity, sendNudge } = useNudgeStore();
  const [nudgeSending, setNudgeSending] = useState<string | null>(null);

  useEffect(() => {
    fetchCircle(circleId);
    fetchFeed(circleId);
    fetchCircleActivity(circleId);
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

      {/* Group Streak */}
      {groupStreak > 0 && (
        <View style={styles.groupStreakBanner}>
          <Text style={styles.groupStreakEmoji}>{groupStreak >= 7 ? '🔥' : '✨'}</Text>
          <Text style={styles.groupStreakText}>
            {groupStreak}-day group streak — everyone logged a habit!
          </Text>
        </View>
      )}

      {/* Accountability — who's active today */}
      {circleActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Today's Activity</Text>
          <View style={styles.activityGrid}>
            {circleActivity
              .filter((m) => m.userId !== user?.id)
              .map((member) => (
                <View key={member.userId} style={styles.activityItem}>
                  <View style={styles.activityAvatar}>
                    <UserAvatar firstName={member.firstName} photoUrl={member.photoUrl} size={36} />
                    {member.activeToday && <View style={styles.activeDot} />}
                  </View>
                  <Text style={[styles.activityName, !member.activeToday && styles.inactiveName]}>
                    {member.firstName}
                  </Text>
                  {member.activeToday ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {member.checkedIn ? '✓' : ''}{member.habitLogged ? '💪' : ''}{member.focused ? '🎯' : ''}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.nudgeButton}
                      disabled={nudgeSending === member.userId}
                      onPress={async () => {
                        setNudgeSending(member.userId);
                        hapticTap();
                        const result = await sendNudge(member.userId, circleId);
                        setNudgeSending(null);
                        if (result.success) {
                          Alert.alert('Nudge sent!', `${member.firstName} will get a notification.`);
                        } else {
                          Alert.alert('Oops', result.error || 'Could not send nudge');
                        }
                      }}
                    >
                      <Text style={styles.nudgeText}>
                        {nudgeSending === member.userId ? '...' : 'Nudge 👋'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
          </View>
        </View>
      )}

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

      {/* Chat button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('CircleChat', { circleId, circleName: currentCircle.name })}
      >
        <Ionicons name="chatbubble-outline" size={18} color="#fff" />
        <Text style={styles.chatButtonText}>Circle Chat</Text>
      </TouchableOpacity>

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
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingRight: 12, paddingLeft: 4, paddingVertical: 4, gap: 6 },
  memberName: { fontSize: 13, color: '#ccc' },
  groupStreakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#1a1a0a', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#3a3a0a',
  },
  groupStreakEmoji: { fontSize: 18 },
  groupStreakText: { fontSize: 13, color: '#f59e0b', fontWeight: '600', flex: 1 },
  activitySection: { paddingHorizontal: 20, marginBottom: 16 },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  activityItem: { alignItems: 'center', width: 72, gap: 4 },
  activityAvatar: { position: 'relative' },
  activeDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#0a0a0a' },
  activityName: { fontSize: 11, color: '#ccc', fontWeight: '500' },
  inactiveName: { color: '#555' },
  statusBadge: { flexDirection: 'row' },
  statusText: { fontSize: 12 },
  nudgeButton: { backgroundColor: '#1a2a1a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#2a3a2a' },
  nudgeText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },
  feed: { flex: 1, borderTopWidth: 1, borderTopColor: '#262626' },
  chatButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, backgroundColor: '#262626', borderTopWidth: 1, borderTopColor: '#333',
  },
  chatButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  emptyFeed: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyFeedText: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 12 },
  emptyFeedSubtext: { fontSize: 13, color: '#444', marginTop: 4, textAlign: 'center' },
  leaveButton: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#262626' },
  leaveText: { fontSize: 14, color: '#f87171', fontWeight: '600' },
});
