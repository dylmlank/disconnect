import React, { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, ViewToken } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = '@disconnect_onboarding_complete';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Disconnect',
    subtitle: 'The app designed to get you off your phone and into the world.',
    emoji: '\u{1F44B}',
  },
  {
    id: '2',
    title: 'Find Your People',
    subtitle: 'Discover local events nearby or drop a beacon to meet people spontaneously.',
    emoji: '\u{1F4CD}',
  },
  {
    id: '3',
    title: 'Less Screen, More Life',
    subtitle: "We track your time here as a low score. The best session is under 2 minutes.\n\nLet's go.",
    emoji: '\u{1F31F}',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Next / Get Started button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingBottom: 60 },
  skipButton: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, color: '#888', fontWeight: '600' },
  slide: { width, justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 120 },
  emoji: { fontSize: 64, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 17, color: '#aaa', textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#4ade80', width: 24 },
  button: {
    backgroundColor: '#4ade80', borderRadius: 12, paddingVertical: 16,
    marginHorizontal: 24, alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
