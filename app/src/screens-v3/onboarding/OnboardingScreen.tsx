import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore, themes } from '../../store/themeStore';
import type { GoalType, UserGoal, FrictionLevel } from '@disconnect/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Step 1: Welcome ──────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Your phone is stealing your life.</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Let's prove it.</Text>

      <View style={styles.spacer} />

      <Text style={[styles.bodyText, { color: colors.textMuted }]}>
        This app doesn't block you. It doesn't shame you.{'\n\n'}
        It shows you the truth about what you're losing — the time, the skills, the person you could
        have been.
      </Text>

      <View style={styles.spacer} />
      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>I'm ready to see</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Basic Info ───────────────────────────────────────

function BasicInfoStep({
  firstName,
  age,
  onFirstNameChange,
  onAgeChange,
  onNext,
}: {
  firstName: string;
  age: string;
  onFirstNameChange: (name: string) => void;
  onAgeChange: (age: string) => void;
  onNext: () => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const isValid = firstName.trim().length > 0 && age.length > 0 && parseInt(age) >= 13;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>A few questions</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        This helps us personalize your experience
      </Text>

      <View style={styles.spacer} />

      <Text style={[styles.label, { color: colors.text }]}>Your first name</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.separator },
        ]}
        value={firstName}
        onChangeText={onFirstNameChange}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <View style={{ height: 24 }} />

      <Text style={[styles.label, { color: colors.text }]}>Your age</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.separator },
        ]}
        value={age}
        onChangeText={onAgeChange}
        placeholder="Your age"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
      />

      {age.length > 0 && parseInt(age) < 13 && (
        <Text style={[styles.errorText, { color: '#ef4444' }]}>
          You must be at least 13 years old
        </Text>
      )}

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isValid ? colors.accent : colors.separator }]}
        onPress={onNext}
        disabled={!isValid}
      >
        <Text style={[styles.buttonText, { opacity: isValid ? 1 : 0.5 }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Goals ─────────────────────────────────────────────

const GOAL_OPTIONS: { type: GoalType; label: string; emoji: string }[] = [
  { type: 'read', label: 'Read more', emoji: '📚' },
  { type: 'exercise', label: 'Exercise', emoji: '💪' },
  { type: 'create', label: 'Create something', emoji: '🎨' },
  { type: 'learn', label: 'Learn a skill', emoji: '🎯' },
  { type: 'connect', label: 'Spend time with people', emoji: '👥' },
  { type: 'outside', label: 'Be outside', emoji: '🌿' },
  { type: 'other', label: 'Something else', emoji: '✨' },
];

function GoalsStep({
  selectedGoals,
  onToggle,
  onNext,
}: {
  selectedGoals: GoalType[];
  onToggle: (goal: GoalType) => void;
  onNext: () => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const hasSelection = selectedGoals.length >= 2;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>What have you been meaning to do?</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Pick at least 2. We'll use this to suggest better alternatives than scrolling.
      </Text>

      <View style={styles.spacer} />

      {GOAL_OPTIONS.map((goal) => (
        <TouchableOpacity
          key={goal.type}
          style={[
            styles.goalOption,
            { backgroundColor: colors.card, borderColor: colors.separator },
            selectedGoals.includes(goal.type) && { borderColor: colors.accent, borderWidth: 2 },
          ]}
          onPress={() => onToggle(goal.type)}
        >
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          <Text style={[styles.goalLabel, { color: colors.text }]}>{goal.label}</Text>
          {selectedGoals.includes(goal.type) && (
            <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: hasSelection ? colors.accent : colors.separator },
        ]}
        onPress={onNext}
        disabled={!hasSelection}
      >
        <Text style={[styles.buttonText, { opacity: hasSelection ? 1 : 0.5 }]}>
          {selectedGoals.length < 2 ? `Select ${2 - selectedGoals.length} more` : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 4: Trigger Apps ──────────────────────────────────────

const COMMON_APPS = [
  { name: 'Instagram', icon: '📸' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'YouTube', icon: '▶️' },
  { name: 'Twitter / X', icon: '🐦' },
  { name: 'Reddit', icon: '💬' },
  { name: 'Facebook', icon: '👤' },
  { name: 'Snapchat', icon: '👻' },
  { name: 'Pinterest', icon: '📌' },
  { name: 'Netflix', icon: '🎬' },
  { name: 'Other...', icon: '➕' },
];

function TriggerAppsStep({
  selectedApps,
  onToggle,
  customApps,
  onCustomAppsChange,
  onNext,
}: {
  selectedApps: string[];
  onToggle: (app: string) => void;
  customApps: string;
  onCustomAppsChange: (apps: string) => void;
  onNext: () => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const hasSelection = selectedApps.length >= 1;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Which apps steal your time?</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Pick the ones that keep you scrolling. We'll track these.
      </Text>

      <View style={styles.spacer} />

      <ScrollView style={{ maxHeight: 300 }}>
        {COMMON_APPS.map((app) => (
          <TouchableOpacity
            key={app.name}
            style={[
              styles.appOption,
              { backgroundColor: colors.card, borderColor: colors.separator },
              selectedApps.includes(app.name) && { borderColor: colors.accent, borderWidth: 2 },
            ]}
            onPress={() => onToggle(app.name)}
          >
            <Text style={styles.appIcon}>{app.icon}</Text>
            <Text style={[styles.appLabel, { color: colors.text }]}>{app.name}</Text>
            {selectedApps.includes(app.name) && (
              <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {selectedApps.includes('Other...') && (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.separator,
                marginTop: 8,
              },
            ]}
            value={customApps}
            onChangeText={onCustomAppsChange}
            placeholder="Other apps (comma separated)"
            placeholderTextColor={colors.textMuted}
          />
        )}
      </ScrollView>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: hasSelection ? colors.accent : colors.separator },
        ]}
        onPress={onNext}
        disabled={!hasSelection}
      >
        <Text style={[styles.buttonText, { opacity: hasSelection ? 1 : 0.5 }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 5: Screen Time Estimate ─────────────────────────────

function ScreenTimeStep({
  hoursPerDay,
  onChange,
  onNext,
}: {
  hoursPerDay: number;
  onChange: (hours: number) => void;
  onNext: () => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  const hoursPerWeek = hoursPerDay * 7;
  const hoursPerYear = hoursPerDay * 365;
  const daysPerYear = Math.round(hoursPerYear / 24);

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>How much time do you spend?</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Estimate your daily time on those apps
      </Text>

      <View style={styles.spacer} />

      <Text style={[styles.bigNumber, { color: colors.accent }]}>{hoursPerDay} hours</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>per day</Text>

      <View style={styles.sliderContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
          <TouchableOpacity
            key={h}
            style={[
              styles.sliderDot,
              { backgroundColor: hoursPerDay === h ? colors.accent : colors.separator },
            ]}
            onPress={() => onChange(h)}
          >
            <Text
              style={[
                styles.sliderLabel,
                { color: hoursPerDay === h ? colors.bg : colors.textMuted },
              ]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.sliderDot,
            { backgroundColor: hoursPerDay === 10 ? colors.accent : colors.separator },
          ]}
          onPress={() => onChange(10)}
        >
          <Text
            style={[
              styles.sliderLabel,
              { color: hoursPerDay === 10 ? colors.bg : colors.textMuted },
            ]}
          >
            10+
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{hoursPerWeek}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>hours/week</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{daysPerYear}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>days/year</Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 6: The Commitment ────────────────────────────────────

function CommitmentStep({
  firstName,
  age,
  hoursPerDay,
  onComplete,
}: {
  firstName: string;
  age: number;
  hoursPerDay: number;
  onComplete: () => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  // Calculate lifetime projections
  const yearsTo30 = Math.max(0, 30 - age);
  const yearsTo40 = Math.max(0, 40 - age);

  const hoursPerYear = hoursPerDay * 365;
  const yearsSpentBy30 = yearsTo30 > 0 ? (hoursPerYear * yearsTo30) / (365 * 24) : 0;
  const yearsSpentBy40 = yearsTo40 > 0 ? (hoursPerYear * yearsTo40) / (365 * 24) : 0;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: colors.text }]}>{firstName}, here's the truth.</Text>

      <View style={styles.spacer} />

      <View
        style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.separator }]}
      >
        <Text style={[styles.bigStatNumber, { color: colors.accent }]}>
          {(hoursPerDay * 365) / 24}
        </Text>
        <Text style={[styles.bigStatLabel, { color: colors.text }]}>
          days per year on those apps
        </Text>
      </View>

      {yearsSpentBy30 > 0 && (
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.separator, marginTop: 12 },
          ]}
        >
          <Text style={[styles.bigStatNumber, { color: colors.text }]}>
            {yearsSpentBy30.toFixed(1)} years
          </Text>
          <Text style={[styles.bigStatLabel, { color: colors.textMuted }]}>
            by age 30 if nothing changes
          </Text>
        </View>
      )}

      {yearsSpentBy40 > 0 && (
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.separator, marginTop: 12 },
          ]}
        >
          <Text style={[styles.bigStatNumber, { color: colors.text }]}>
            {yearsSpentBy40.toFixed(1)} years
          </Text>
          <Text style={[styles.bigStatLabel, { color: colors.textMuted }]}>
            by age 40 if nothing changes
          </Text>
        </View>
      )}

      <View style={styles.spacer} />

      <Text style={[styles.bodyText, { color: colors.textMuted, textAlign: 'center' }]}>
        The average person spends 7 years of their life on social media.
        {'\n\n'}
        What could you build with that time?
      </Text>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={onComplete}
      >
        <Text style={styles.buttonText}>I want to change this</Text>
      </TouchableOpacity>

      <Text
        style={[styles.smallText, { color: colors.textMuted, marginTop: 16, textAlign: 'center' }]}
      >
        You can adjust these settings anytime
      </Text>
    </View>
  );
}

// ─── Main Onboarding Screen ────────────────────────────────────

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: (data: OnboardingData) => void;
}) {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  const [step, setStep] = useState(0);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [customApps, setCustomApps] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);

  const toggleGoal = (goal: GoalType) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const toggleApp = (app: string) => {
    setSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app],
    );
  };

  const handleComplete = () => {
    const finalApps = selectedApps.filter((a) => a !== 'Other...');
    if (customApps.trim()) {
      finalApps.push(
        ...customApps
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      );
    }

    const goals: UserGoal[] = selectedGoals.map((type, index) => ({
      type,
      priority: index + 1,
      ...(type === 'other' && { customLabel: 'Custom goal' }),
    }));

    onComplete({
      firstName,
      age: parseInt(age),
      goals,
      triggerApps: finalApps,
      estimatedDailyScreenTime: hoursPerDay,
      frictionSettings: {
        level: 'moderate' as FrictionLevel,
        pauseEnabled: true,
        mirrorEnabled: true,
        countdownEnabled: true,
        costEnabled: true,
        countdownSeconds: 10,
      },
    });
  };

  const steps = [
    <WelcomeStep key="welcome" onNext={() => setStep(1)} />,
    <BasicInfoStep
      key="basic"
      firstName={firstName}
      age={age}
      onFirstNameChange={setFirstName}
      onAgeChange={setAge}
      onNext={() => setStep(2)}
    />,
    <GoalsStep
      key="goals"
      selectedGoals={selectedGoals}
      onToggle={toggleGoal}
      onNext={() => setStep(3)}
    />,
    <TriggerAppsStep
      key="apps"
      selectedApps={selectedApps}
      onToggle={toggleApp}
      customApps={customApps}
      onCustomAppsChange={setCustomApps}
      onNext={() => setStep(4)}
    />,
    <ScreenTimeStep
      key="time"
      hoursPerDay={hoursPerDay}
      onChange={setHoursPerDay}
      onNext={() => setStep(5)}
    />,
    <CommitmentStep
      key="commit"
      firstName={firstName}
      age={parseInt(age)}
      hoursPerDay={hoursPerDay}
      onComplete={handleComplete}
    />,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: i === step ? colors.accent : colors.separator },
            ]}
          />
        ))}
      </View>

      {steps[step]}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  spacer: {
    flex: 1,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  goalEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  goalLabel: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  appOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: 1,
  },
  appIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  appLabel: {
    fontSize: 15,
    flex: 1,
  },
  bigNumber: {
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  sliderDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  bigStatNumber: {
    fontSize: 40,
    fontWeight: '700',
  },
  bigStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  smallText: {
    fontSize: 12,
  },
});

// ─── Types ─────────────────────────────────────────────────────

export interface OnboardingData {
  firstName: string;
  age: number;
  goals: UserGoal[];
  triggerApps: string[];
  estimatedDailyScreenTime: number;
  frictionSettings: {
    level: FrictionLevel;
    pauseEnabled: boolean;
    mirrorEnabled: boolean;
    countdownEnabled: boolean;
    costEnabled: boolean;
    countdownSeconds: number;
  };
}
