import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { API_URL } from '../constants/config';

interface Props {
  firstName: string;
  photoUrl?: string | null;
  size?: number;
}

export default function UserAvatar({ firstName, photoUrl, size = 36 }: Props) {
  const uri = photoUrl
    ? photoUrl.startsWith('http') ? photoUrl : `${API_URL.replace('/api', '')}${photoUrl}`
    : null;

  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{firstName[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#262626' },
  fallback: { backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  initial: { fontWeight: '700', color: '#4ade80' },
});
