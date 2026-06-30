import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, themes } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useUserPreferencesStore } from '../store/userPreferencesStore';

// v3 screens
import { OnboardingScreen, type OnboardingData } from '../screens-v3/onboarding';
import { HomeScreen } from '../screens-v3/home';
import InsightsScreen from '../screens-v3/insights/InsightsScreen';
import SettingsScreen from '../screens-v3/settings/SettingsScreen';
import BoredScreen from '../screens-v3/bored/BoredScreen';
import { BreakFlowOverlay } from '../components-v3';

// Auth fallback
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const V3_ONBOARDING_KEY = 'v3_onboarding_complete';

// ─── Theme Setup ────────────────────────────────────────────

function useNavTheme() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      border: colors.separator,
      primary: colors.accent,
    },
  };
}

// ─── Tab Navigator ──────────────────────────────────────────

function MainTabs() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InsightsTab"
        component={InsightsScreen}
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack Navigator (for modals) ────────────────────────────

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Bored" component={BoredScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

// ─── Main Navigator ─────────────────────────────────────────

export default function V3Navigator() {
  const user = useAuthStore((s) => s.user);
  const loadTheme = useThemeStore((s) => s.load);
  const loadProfile = useUserPreferencesStore((s) => s.loadProfile);
  const hasCompletedOnboarding = useUserPreferencesStore((s) => s.hasCompletedOnboarding);
  const isLoading = useUserPreferencesStore((s) => s.isLoading);
  const completeOnboarding = useUserPreferencesStore((s) => s.completeOnboarding);
  const navTheme = useNavTheme();

  useEffect(() => {
    loadTheme();
    loadProfile();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  // No user — need to create profile
  if (!user) {
    return (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Onboarding not completed
  if (!hasCompletedOnboarding) {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingScreen
          onComplete={async (data: OnboardingData) => {
            await completeOnboarding(data);
          }}
        />
      </View>
    );
  }

  // Main app
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme}>
        <MainStack />
      </NavigationContainer>
      <BreakFlowOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
