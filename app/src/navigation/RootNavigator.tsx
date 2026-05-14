import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { setTokenProvider } from '../services/api';
import { useScreenTime } from '../hooks/useScreenTime';
import { useNotifications } from '../hooks/useNotifications';
import { useLocationSync } from '../hooks/useLocationSync';
import ScreenTimeNudge from '../components/ScreenTimeNudge';
import AchievementToast from '../components/AchievementToast';

// Auth screens
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

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
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import InviteScreen from '../screens/profile/InviteScreen';
import BadgesScreen from '../screens/profile/BadgesScreen';
import WeeklyRecapScreen from '../screens/profile/WeeklyRecapScreen';
import MoodTrendsScreen from '../screens/profile/MoodTrendsScreen';

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
import DiscoverScreen from '../screens/hub/DiscoverScreen';
import CircleChatScreen from '../screens/hub/CircleChatScreen';
import VibeCheckScreen from '../screens/hub/VibeCheckScreen';
import StudyRoomsScreen from '../screens/hub/StudyRoomsScreen';
import PhotoFeedScreen from '../screens/hub/PhotoFeedScreen';
import WalkTalkScreen from '../screens/hub/WalkTalkScreen';

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

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="EventList" component={EventListScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
      <Stack.Screen name="EventChat" component={EventChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.title || 'Chat' })} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function BeaconsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="BeaconMap" component={BeaconMapScreen} options={{ title: 'Beacons' }} />
      <Stack.Screen name="CreateBeacon" component={CreateBeaconScreen} options={{ title: 'Drop Beacon' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Invite" component={InviteScreen} options={{ title: 'Invite Friends' }} />
      <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: 'Badges' }} />
      <Stack.Screen name="MoodTrends" component={MoodTrendsScreen} options={{ title: 'Mood Trends' }} />
      <Stack.Screen name="WeeklyRecap" component={WeeklyRecapScreen} options={{ title: 'Weekly Recap' }} />
    </Stack.Navigator>
  );
}

function HubStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}>
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
      <Stack.Screen name="VibeCheck" component={VibeCheckScreen} options={{ title: 'Vibe Check', headerShown: false }} />
      <Stack.Screen name="StudyRooms" component={StudyRoomsScreen} options={{ title: 'Study Rooms' }} />
      <Stack.Screen name="PhotoFeed" component={PhotoFeedScreen} options={{ title: 'Proof Feed' }} />
      <Stack.Screen name="WalkTalk" component={WalkTalkScreen} options={{ title: 'Walk & Talk' }} />
      <Stack.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Discover People' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="CircleChat" component={CircleChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.circleName ? `${route.params.circleName} Chat` : 'Chat' })} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused, color, isCenter }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string; isCenter?: boolean }) {
  const iconSize = isCenter ? 26 : 22;
  return (
    <View style={focused ? tabStyles.activeWrap : tabStyles.inactiveWrap}>
      {focused && <View style={[tabStyles.activePill, isCenter && tabStyles.centerPill]} />}
      <Ionicons name={name} size={iconSize} color={color} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  activeWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: 2 },
  inactiveWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  activePill: {
    position: 'absolute', top: -4, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  centerPill: { width: 42, height: 42, borderRadius: 21, top: -6 },
});

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HubTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="EventsTab" component={EventsStack} options={{
        title: 'Events',
        tabBarIcon: ({ focused, color }) => <TabIcon name="calendar-outline" focused={focused} color={color} />,
      }} />
      <Tab.Screen name="BeaconsTab" component={BeaconsStack} options={{
        title: 'Map',
        tabBarIcon: ({ focused, color }) => <TabIcon name="map-outline" focused={focused} color={color} />,
      }} />
      <Tab.Screen name="HubTab" component={HubStack} options={{
        title: 'Hub',
        tabBarIcon: ({ focused, color }) => <TabIcon name="flash-outline" focused={focused} color={color} isCenter />,
      }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{
        title: 'Profile',
        tabBarIcon: ({ focused, color }) => <TabIcon name="person-outline" focused={focused} color={color} />,
      }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { showNudge, dismissNudge } = useScreenTime();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Sync location to server for Discover feature
  useLocationSync();

  // Check onboarding status
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  // Wire Clerk's getToken into the API service
  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  // When signed in and no local profile loaded yet, fetch it
  useEffect(() => {
    if (isSignedIn && !user) {
      fetchMe().catch(() => {
        // 404 means profile doesn't exist yet — user needs to create one
      });
    }
  }, [isSignedIn]);

  const handleNotificationTap = useCallback((data: Record<string, string>) => {
    const nav = navigationRef.current;
    if (!nav) return;

    if (data.type === 'event_reminder' || data.type === 'chat_message') {
      nav.navigate('EventsTab', {
        screen: 'EventDetail',
        params: { eventId: data.eventId },
      });
    } else if (data.type === 'beacon_interest') {
      nav.navigate('BeaconsTab', { screen: 'BeaconMap' });
    }
  }, []);

  useNotifications(handleNotificationTap);

  if (!isLoaded || onboardingDone === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  // Four-state routing:
  // 1. Not signed in → AuthStack (phone entry + verify code)
  // 2. Signed in but no profile → CreateProfile
  // 3. Signed in with profile but onboarding not done → Onboarding
  // 4. Signed in with profile + onboarding done → MainTabs
  let content;
  if (!isSignedIn) {
    content = <AuthStack />;
  } else if (!user) {
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
      <AchievementToast />
      <ScreenTimeNudge visible={showNudge} onDismiss={dismissNudge} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
});
