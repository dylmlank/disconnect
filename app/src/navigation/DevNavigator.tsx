import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useScreenTime } from '../hooks/useScreenTime';
import ScreenTimeNudge from '../components/ScreenTimeNudge';

// Event screens
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventChatScreen from '../screens/events/EventChatScreen';
import MyEventsScreen from '../screens/events/MyEventsScreen';

// Beacon screens
import BeaconMapScreen from '../screens/beacons/BeaconMapScreen';
import CreateBeaconScreen from '../screens/beacons/CreateBeaconScreen';

// Profile screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import BlockedUsersScreen from '../screens/profile/BlockedUsersScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Hub screens
import HubScreen from '../screens/hub/HubScreen';
import CirclesScreen from '../screens/hub/CirclesScreen';
import CircleDetailScreen from '../screens/hub/CircleDetailScreen';
import CreateCircleScreen from '../screens/hub/CreateCircleScreen';
import JoinCircleScreen from '../screens/hub/JoinCircleScreen';
import HabitsScreen from '../screens/hub/HabitsScreen';
import CheckInScreen from '../screens/hub/CheckInScreen';
import ChallengesScreen from '../screens/hub/ChallengesScreen';
import ChallengeDetailScreen from '../screens/hub/ChallengeDetailScreen';
import CreateChallengeScreen from '../screens/hub/CreateChallengeScreen';
import FocusScreen from '../screens/hub/FocusScreen';

// Auth screens (for create profile if needed)
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

// Onboarding
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0a0a0a',
    card: '#0a0a0a',
    text: '#fff',
    border: '#262626',
    primary: '#4ade80',
  },
};

const headerOptions = { headerStyle: { backgroundColor: '#0a0a0a' as const }, headerTintColor: '#fff' };

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="EventList" component={EventListScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
      <Stack.Screen name="EventChat" component={EventChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.title || 'Chat' })} />
    </Stack.Navigator>
  );
}

function BeaconsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="BeaconMap" component={BeaconMapScreen} options={{ title: 'Beacons' }} />
      <Stack.Screen name="CreateBeacon" component={CreateBeaconScreen} options={{ title: 'Drop Beacon' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

function HubStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Hub" component={HubScreen} options={{ title: 'Hub' }} />
      <Stack.Screen name="Circles" component={CirclesScreen} options={{ title: 'My Circles' }} />
      <Stack.Screen name="CircleDetail" component={CircleDetailScreen} options={({ route }: { route: any }) => ({ title: route.params?.circleName || 'Circle' })} />
      <Stack.Screen name="CreateCircle" component={CreateCircleScreen} options={{ title: 'New Circle' }} />
      <Stack.Screen name="JoinCircle" component={JoinCircleScreen} options={{ title: 'Join Circle' }} />
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: 'Habits' }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check In' }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Challenges' }} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: 'Challenge' }} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{ title: 'New Challenge' }} />
      <Stack.Screen name="Focus" component={FocusScreen} options={{ title: 'Focus', headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#262626' },
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen name="EventsTab" component={EventsStack} options={{
        title: 'Events',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
      }} />
      <Tab.Screen name="BeaconsTab" component={BeaconsStack} options={{
        title: 'Map',
        tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
      }} />
      <Tab.Screen name="HubTab" component={HubStack} options={{
        title: 'Hub',
        tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} />,
      }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tab.Navigator>
  );
}

export default function DevNavigator() {
  const user = useAuthStore((s) => s.user);
  const { showNudge, dismissNudge } = useScreenTime();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (onboardingDone === null) return null;

  let content;
  if (!user) {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      </Stack.Navigator>
    );
  } else if (!onboardingDone) {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </View>
    );
  } else {
    content = <MainTabs />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={DarkTheme}>
        {content}
      </NavigationContainer>
      <ScreenTimeNudge visible={showNudge} onDismiss={dismissNudge} />
    </View>
  );
}
