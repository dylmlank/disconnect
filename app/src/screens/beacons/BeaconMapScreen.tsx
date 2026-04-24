import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform, Alert } from 'react-native';
import { useBeaconStore } from '../../store/beaconStore';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import api from '../../services/api';
import type { BeaconWithCreator } from '@disconnect/shared';

// react-native-maps crashes on web — load conditionally
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

export default function BeaconMapScreen({ navigation }: { navigation: any }) {
  const { beacons, isLoading, fetchBeacons, expressInterest } = useBeaconStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [selectedBeacon, setSelectedBeacon] = useState<BeaconWithCreator | null>(null);

  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchBeacons(location.latitude, location.longitude);
    }
  }, [location.loading, location.latitude, location.longitude]);

  // Refresh every 30 seconds
  useEffect(() => {
    if (location.loading || location.error) return;
    const interval = setInterval(() => {
      fetchBeacons(location.latitude, location.longitude);
    }, 30000);
    return () => clearInterval(interval);
  }, [location.loading, location.latitude, location.longitude]);

  if (location.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (location.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{location.error}</Text>
      </View>
    );
  }

  const handleInterest = async (beacon: BeaconWithCreator) => {
    await expressInterest(beacon.id);
    setSelectedBeacon(null);
  };

  return (
    <View style={styles.container}>
      {MapView ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation
          userInterfaceStyle="dark"
        >
          {beacons.map((beacon) => (
            <Marker
              key={beacon.id}
              coordinate={{ latitude: beacon.location.latitude, longitude: beacon.location.longitude }}
              pinColor="#4ade80"
              onPress={() => setSelectedBeacon(beacon)}
            >
              <Callout>
                <View style={{ padding: 4, maxWidth: 200 }}>
                  <Text style={{ fontWeight: '700' }}>{beacon.message}</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {beacon.creator.firstName} {beacon.activity ? `· ${beacon.activity}` : ''}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={styles.webList}>
          {beacons.length === 0 && <Text style={styles.emptyText}>No beacons nearby</Text>}
          {beacons.map((beacon) => (
            <TouchableOpacity key={beacon.id} style={styles.webCard} onPress={() => setSelectedBeacon(beacon)}>
              <Text style={styles.webCardMessage}>{beacon.message}</Text>
              {beacon.activity && <Text style={styles.webCardActivity}>{beacon.activity}</Text>}
              <Text style={styles.webCardMeta}>
                {beacon.creator.firstName} {beacon.placeName ? `· ${beacon.placeName}` : ''} · {beacon.interestCount} interested
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Create beacon FAB - adults only */}
      {user && !user.isMinor && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateBeacon')}>
          <Text style={styles.fabText}>+ Beacon</Text>
        </TouchableOpacity>
      )}

      {/* Beacon detail modal */}
      {selectedBeacon && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedBeacon(null)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedBeacon(null)} activeOpacity={1}>
            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>{selectedBeacon.message}</Text>
              {selectedBeacon.activity && <Text style={styles.modalActivity}>{selectedBeacon.activity}</Text>}
              {selectedBeacon.placeName && <Text style={styles.modalPlace}>{selectedBeacon.placeName}</Text>}
              <Text style={styles.modalCreator}>
                {selectedBeacon.creator.firstName} · {selectedBeacon.interestCount} interested
              </Text>

              {selectedBeacon.creatorId !== user?.id && (
                <>
                  <TouchableOpacity
                    style={[styles.interestButton, selectedBeacon.hasExpressedInterest && styles.interestButtonDone]}
                    onPress={() => handleInterest(selectedBeacon)}
                    disabled={selectedBeacon.hasExpressedInterest}
                  >
                    <Text style={styles.interestText}>
                      {selectedBeacon.hasExpressedInterest ? "You're interested" : "I'm interested"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.blockButton}
                    onPress={() => {
                      Alert.alert('Block User', `Block ${selectedBeacon.creator.firstName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Block',
                          style: 'destructive',
                          onPress: async () => {
                            await api.post('/blocks', { userId: selectedBeacon.creatorId });
                            setSelectedBeacon(null);
                            if (!location.loading && !location.error) {
                              fetchBeacons(location.latitude, location.longitude);
                            }
                          },
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.blockText}>Block User</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#4ade80" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#f87171', fontSize: 16, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#4ade80', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  loadingOverlay: { position: 'absolute', top: 16, right: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40,
  },
  modalMessage: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalActivity: { fontSize: 14, color: '#4ade80', fontWeight: '600', marginBottom: 4 },
  modalPlace: { fontSize: 14, color: '#888', marginBottom: 12 },
  modalCreator: { fontSize: 13, color: '#aaa', marginBottom: 20 },
  interestButton: { backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center' },
  interestButtonDone: { backgroundColor: '#333' },
  interestText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  blockButton: { padding: 12, alignItems: 'center', marginTop: 8 },
  blockText: { fontSize: 13, color: '#f87171' },
  webList: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  webCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#262626' },
  webCardMessage: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  webCardActivity: { fontSize: 13, color: '#4ade80', fontWeight: '600', marginBottom: 4 },
  webCardMeta: { fontSize: 12, color: '#888' },
  emptyText: { color: '#666', fontSize: 16, textAlign: 'center', marginTop: 48 },
});
