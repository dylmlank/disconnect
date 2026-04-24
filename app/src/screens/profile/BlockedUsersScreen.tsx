import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';

interface BlockedUser {
  id: string;
  firstName: string;
}

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    try {
      const { data } = await api.get('/blocks');
      setUsers(data.blockedUsers);
    } catch {
      Alert.alert('Error', 'Failed to load blocked users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId: string, name: string) => {
    Alert.alert('Unblock', `Unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/blocks/${userId}`);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
          } catch {
            Alert.alert('Error', 'Failed to unblock user.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No blocked users</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.firstName[0]}</Text>
              </View>
              <Text style={styles.name}>{item.firstName}</Text>
              <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(item.id, item.firstName)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  list: { padding: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#262626',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4ade80' },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  unblockButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#f87171',
  },
  unblockText: { fontSize: 13, fontWeight: '600', color: '#f87171' },
});
