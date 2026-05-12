import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HubScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hub</Text>
      <Text style={styles.subtitle}>Your daily productivity dashboard</Text>
      <Text style={styles.coming}>Circles, Challenges, Habits, Focus, and Check-ins — coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  coming: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
});
