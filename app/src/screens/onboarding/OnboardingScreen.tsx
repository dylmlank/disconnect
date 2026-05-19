import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewToken,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURATED_HABITS, CHALLENGE_TEMPLATES } from '@disconnect/shared';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = '@disconnect_onboarding_complete';

// ─── Slide definitions ───────────────────────────────────────

type SlideKind = 'static' | 'habits' | 'challenge' | 'circle';

interface BaseSlide {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  kind: SlideKind;
}

type SlideData = BaseSlide;

const SLIDES: SlideData[] = [
  {
    id: '1',
    kind: 'static',
    title: 'Welcome to Disconnect',
    subtitle: 'The app designed to get you off your phone\nand into the world.',
    emoji: '👋',
    accent: '#4ade80',
  },
  {
    id: '2',
    kind: 'static',
    title: 'Track What Matters',
    subtitle: 'Build habits, check in daily, and see your progress.\nScience-backed — not engagement-hacked.',
    emoji: '🌱',
    accent: '#4ade80',
  },
  {
    id: '3',
    kind: 'static',
    title: 'Find Your People',
    subtitle: 'Discover events nearby, drop beacons to meet spontaneously, and join circles for accountability.',
    emoji: '📍',
    accent: '#60a5fa',
  },
  {
    id: '4',
    kind: 'static',
    title: 'Focus Together',
    subtitle: 'Start focus sessions, join study rooms, and walk with others — no video, just presence.',
    emoji: '🎯',
    accent: '#f59e0b',
  },
  {
    id: '5',
    kind: 'static',
    title: 'Less Screen, More Life',
    subtitle: "We track your time here as a LOW score.\nThe best session is under 2 minutes.\n\nLet's go.",
    emoji: '🌟',
    accent: '#4ade80',
  },
  {
    id: 'setup_habits',
    kind: 'habits',
    title: 'Pick Your Habits',
    subtitle: 'Choose up to 5 daily practices (you can change later)',
    emoji: '✅',
    accent: '#4ade80',
  },
  {
    id: 'setup_challenge',
    kind: 'challenge',
    title: 'Start a Challenge',
    subtitle: 'Join one to get started (optional)',
    emoji: '🏆',
    accent: '#f59e0b',
  },
  {
    id: 'setup_circle',
    kind: 'circle',
    title: 'Create Your Circle',
    subtitle: "You'll get an invite code to share with 2-7 friends",
    emoji: '🔗',
    accent: '#60a5fa',
  },
];

// Only show "Skip" on intro slides (before setup steps)
const LAST_INTRO_INDEX = 4;

// ─── Props ───────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

// ─── Main Component ──────────────────────────────────────────

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  // Setup state — collected across slides
  const selectedHabits = useRef<string[]>([]);
  const selectedChallengeId = useRef<string | null>(null);
  const circleName = useRef<string>('');

  // Re-render triggers for interactive slides
  const [habitsVersion, setHabitsVersion] = useState(0);
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [circleNameText, setCircleNameText] = useState('');

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const scrollTo = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

    // Fire-and-forget — never block onboarding on network errors
    (async () => {
      // POST selected habits
      for (const habitId of selectedHabits.current) {
        try {
          await api.post('/api/habits', { habitId });
        } catch {
          // silent
        }
      }

      // POST selected challenge (create + auto-join)
      if (selectedChallengeId.current) {
        const template = CHALLENGE_TEMPLATES.find((t) => t.id === selectedChallengeId.current);
        if (template) {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const res = await api.post('/api/challenges', {
              title: template.title,
              description: template.description,
              durationDays: template.durationDays,
              dailyRequirement: template.dailyRequirement,
              category: template.category,
              researchNote: template.researchNote,
              startsAt: today,
              isPublic: true,
            });
            // Join the newly created challenge
            const challengeId: string = res.data?.id;
            if (challengeId) {
              await api.post(`/api/challenges/${challengeId}/join`);
            }
          } catch {
            // silent
          }
        }
      }

      // POST circle creation
      if (circleName.current.trim()) {
        try {
          await api.post('/api/circles', { name: circleName.current.trim() });
        } catch {
          // silent
        }
      }
    })();

    onComplete();
  };

  const currentSlide = SLIDES[currentIndex];

  // ─── Habit toggle ────────────────────────────────────────
  const toggleHabit = (id: string) => {
    const list = selectedHabits.current;
    const idx = list.indexOf(id);
    if (idx >= 0) {
      selectedHabits.current = list.filter((h) => h !== id);
    } else if (list.length < 5) {
      selectedHabits.current = [...list, id];
    }
    setHabitsVersion((v) => v + 1);
  };

  // ─── Challenge toggle ────────────────────────────────────
  const toggleChallenge = (id: string) => {
    selectedChallengeId.current = selectedChallengeId.current === id ? null : id;
    setChallengeVersion((v) => v + 1);
  };

  // ─── Next button label ───────────────────────────────────
  const getNextLabel = () => {
    if (currentIndex === SLIDES.length - 1) return "Let's Go";
    if (currentSlide.kind === 'challenge' && !selectedChallengeId.current) return 'Skip';
    if (currentSlide.kind === 'circle' && !circleNameText.trim()) return 'Skip';
    return 'Next';
  };

  // ─── Render slide content ────────────────────────────────
  const renderSlideContent = (slide: SlideData) => {
    if (slide.kind === 'static') {
      return (
        <View style={styles.slideCenter}>
          <View style={[styles.emojiCircle, { backgroundColor: `${slide.accent}15` }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </View>
      );
    }

    if (slide.kind === 'habits') {
      const selected = selectedHabits.current;
      return (
        <View style={styles.setupSlide}>
          <View style={[styles.emojiCircle, { backgroundColor: `${slide.accent}15` }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={[styles.selectionHint, { color: slide.accent }]}>
            {selected.length}/5 selected
          </Text>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {CURATED_HABITS.map((habit) => {
              const isSelected = selected.includes(habit.id);
              const isDisabled = !isSelected && selected.length >= 5;
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    isSelected && { borderColor: slide.accent, backgroundColor: `${slide.accent}18` },
                    isDisabled && styles.cardDisabled,
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardEmoji}>{habit.emoji}</Text>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isSelected && { color: '#fff' }]}>{habit.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>{habit.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: slide.accent }]}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (slide.kind === 'challenge') {
      // Show first 3 templates
      const templates = CHALLENGE_TEMPLATES.slice(0, 3);
      const selectedId = selectedChallengeId.current;
      return (
        <View style={styles.setupSlide}>
          <View style={[styles.emojiCircle, { backgroundColor: `${slide.accent}15` }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <View style={styles.challengeCards}>
            {templates.map((tmpl) => {
              const isSelected = selectedId === tmpl.id;
              return (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[
                    styles.challengeCard,
                    isSelected && { borderColor: slide.accent, backgroundColor: `${slide.accent}18` },
                  ]}
                  onPress={() => toggleChallenge(tmpl.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.challengeCardHeader}>
                    <Text style={[styles.cardTitle, isSelected && { color: '#fff' }]}>{tmpl.title}</Text>
                    <Text style={[styles.durationBadge, isSelected && { color: slide.accent }]}>
                      {tmpl.durationDays}d
                    </Text>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{tmpl.description}</Text>
                  {isSelected && (
                    <View style={[styles.selectedDot, { backgroundColor: slide.accent }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (slide.kind === 'circle') {
      return (
        <View style={styles.setupSlide}>
          <View style={[styles.emojiCircle, { backgroundColor: `${slide.accent}15` }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <TextInput
            style={[styles.circleInput, circleNameText.trim() && { borderColor: slide.accent }]}
            placeholder="e.g. Morning Crew, Gym Buddies…"
            placeholderTextColor="#444"
            value={circleNameText}
            onChangeText={(t) => {
              setCircleNameText(t);
              circleName.current = t;
            }}
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {circleNameText.trim().length > 0 && (
            <Text style={[styles.circleHint, { color: slide.accent }]}>
              You'll get an invite code after setup ✓
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Skip button — only on intro slides */}
      {currentIndex <= LAST_INTRO_INDEX && (
        <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {renderSlideContent(item)}
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              i === currentIndex && [styles.dotActive, { backgroundColor: currentSlide.accent }],
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: currentSlide.accent }]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>{getNextLabel()}</Text>
      </TouchableOpacity>

      {/* Page counter */}
      <Text style={styles.pageCounter}>
        {currentIndex + 1} / {SLIDES.length}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingBottom: 50 },

  skipButton: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, color: '#555', fontWeight: '600' },

  slide: { width, flex: 1 },

  // Static slides: centred layout
  slideCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },

  // Interactive slides: top-anchored with scroll
  setupSlide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 24,
  },

  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: { fontSize: 38 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 4 },

  // Habit slide
  selectionHint: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 12 },
  cardScroll: { width: '100%', flex: 1 },
  cardScrollContent: { paddingBottom: 16 },

  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  cardDisabled: { opacity: 0.35 },
  cardEmoji: { fontSize: 24, marginRight: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ccc', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#555' },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkMark: { fontSize: 12, fontWeight: '800', color: '#0a0a0a' },

  // Challenge slide
  challengeCards: { width: '100%', marginTop: 16, gap: 10 },
  challengeCard: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#111',
  },
  challengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  durationBadge: { fontSize: 13, fontWeight: '700', color: '#555' },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  // Circle slide
  circleInput: {
    width: '100%',
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#111',
  },
  circleHint: { fontSize: 13, fontWeight: '600', marginTop: 10 },

  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap', paddingHorizontal: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#222', marginHorizontal: 3 },
  dotActive: { width: 18 },

  // CTA
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  pageCounter: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 12 },
});
