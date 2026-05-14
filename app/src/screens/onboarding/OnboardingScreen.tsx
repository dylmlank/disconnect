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
  accent: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Disconnect',
    subtitle: 'The app designed to get you off your phone\nand into the world.',
    emoji: '👋',
    accent: '#4ade80',
  },
  {
    id: '2',
    title: 'Track What Matters',
    subtitle: 'Build habits, check in daily, and see your progress.\nScience-backed — not engagement-hacked.',
    emoji: '🌱',
    accent: '#4ade80',
  },
  {
    id: '3',
    title: 'Find Your People',
    subtitle: 'Discover events nearby, drop beacons to meet spontaneously, and join circles for accountability.',
    emoji: '📍',
    accent: '#60a5fa',
  },
  {
    id: '4',
    title: 'Focus Together',
    subtitle: 'Start focus sessions, join study rooms, and walk with others — no video, just presence.',
    emoji: '🎯',
    accent: '#f59e0b',
  },
  {
    id: '5',
    title: 'Less Screen, More Life',
    subtitle: "We track your time here as a LOW score.\nThe best session is under 2 minutes.\n\nLet's go.",
    emoji: '🌟',
    accent: '#4ade80',
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

  const currentSlide = slides[currentIndex];

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
            <View style={[styles.emojiCircle, { backgroundColor: `${item.accent}15` }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && [styles.dotActive, { backgroundColor: currentSlide.accent }]]} />
        ))}
      </View>

      {/* Next / Get Started button */}
      <TouchableOpacity style={[styles.button, { backgroundColor: currentSlide.accent }]} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? "Let's Go" : "Next"}
        </Text>
      </TouchableOpacity>

      {/* Page counter */}
      <Text style={styles.pageCounter}>{currentIndex + 1} / {slides.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingBottom: 50 },
  skipButton: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, color: '#555', fontWeight: '600' },
  slide: { width, justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 100 },
  emojiCircle: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
    marginBottom: 32,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#999', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222', marginHorizontal: 4 },
  dotActive: { width: 24 },
  button: {
    borderRadius: 14, paddingVertical: 16,
    marginHorizontal: 24, alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  pageCounter: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 12 },
});
