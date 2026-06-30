import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore, themes } from '../../store/themeStore';
import type { Suggestion, GoalType } from '@disconnect/shared';
import { getSuggestions } from '../../data/suggestions';

// TODO: Get from user store
const USER_GOALS: GoalType[] = ['read', 'exercise', 'learn'];

export default function BoredScreen() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    loadNewSuggestions();
  }, []);

  const loadNewSuggestions = () => {
    const newSuggestions = getSuggestions(USER_GOALS, 5);
    setSuggestions(newSuggestions);
  };

  const formatDuration = (minutes: number) => {
    if (minutes <= 5) return `${minutes} min`;
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Bored? Try this instead.</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Pick one. You'll feel better.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.id + index}
            style={[
              styles.suggestionCard,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.emoji}>{suggestion.emoji}</Text>
              {suggestion.durationMinutes && (
                <Text style={[styles.duration, { color: colors.accent }]}>
                  {formatDuration(suggestion.durationMinutes)}
                </Text>
              )}
            </View>
            <Text style={[styles.suggestionTitle, { color: colors.text }]}>{suggestion.title}</Text>
            <Text style={[styles.suggestionDesc, { color: colors.textMuted }]}>
              {suggestion.description}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: colors.card, borderColor: colors.separator },
          ]}
          onPress={loadNewSuggestions}
        >
          <Text style={[styles.refreshText, { color: colors.text }]}>
            🔄 Show me different suggestions
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          You could scroll. Or you could actually do something.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  suggestionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 20,
  },
  refreshText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
