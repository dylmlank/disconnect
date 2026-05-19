import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, themes } from '../store/themeStore';
import { useScreenTime } from '../hooks/useScreenTime';
import ScreenTimeNudge from '../components/ScreenTimeNudge';
import AchievementToast from '../components/AchievementToast';

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
import HabitsScreen from '../screens/hub/HabitsScreen';
import CheckInScreen from '../screens/hub/CheckInScreen';
import ChallengesScreen from '../screens/hub/ChallengesScreen';
import ChallengeDetailScreen from '../screens/hub/ChallengeDetailScreen';
import CreateChallengeScreen from '../screens/hub/CreateChallengeScreen';
import FocusScreen from '../screens/hub/FocusScreen';
import VibeCheckScreen from '../screens/hub/VibeCheckScreen';
import StudyRoomsScreen from '../screens/hub/StudyRoomsScreen';
import PhotoFeedScreen from '../screens/hub/PhotoFeedScreen';
import WalkTalkScreen from '../screens/hub/WalkTalkScreen';

// Social screens
import CirclesScreen from '../screens/hub/CirclesScreen';
import CircleDetailScreen from '../screens/hub/CircleDetailScreen';
import CreateCircleScreen from '../screens/hub/CreateCircleScreen';
import JoinCircleScreen from '../screens/hub/JoinCircleScreen';
import CircleChatScreen from '../screens/hub/CircleChatScreen';
import DiscoverScreen from '../screens/hub/DiscoverScreen';

// Auth screens (for create profile if needed)
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

// Onboarding
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

function useScreenDefaults() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];
  return {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    headerTitleStyle: { fontSize: 17, fontWeight: '600' as const },
  };
}

function EventsStack() {
  const screenDefaults = useScreenDefaults();
  return (
    <Stack.Navigator screenOptions={screenDefaults}>
      <Stack.Screen name="EventList" component={EventListScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
      <Stack.Screen name="EventChat" component={EventChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.title || 'Chat' })} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function BeaconsStack() {
  const screenDefaults = useScreenDefaults();
  return (
    <Stack.Navigator screenOptions={screenDefaults}>
      <Stack.Screen name="BeaconMap" component={BeaconMapScreen} options={{ title: 'Beacons', headerShown: false }} />
      <Stack.Screen name="CreateBeacon" component={CreateBeaconScreen} options={{ title: 'Drop Beacon' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const screenDefaults = useScreenDefaults();
  return (
    <Stack.Navigator screenOptions={screenDefaults}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
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
  const screenDefaults = useScreenDefaults();
  return (
    <Stack.Navigator screenOptions={screenDefaults}>
      <Stack.Screen name="Hub" component={HubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: 'Habits' }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check In' }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Challenges' }} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{ title: 'New Challenge' }} />
      <Stack.Screen name="Focus" component={FocusScreen} options={{ title: 'Focus', headerShown: false }} />
      <Stack.Screen name="VibeCheck" component={VibeCheckScreen} options={{ title: '', headerShown: false }} />
      <Stack.Screen name="StudyRooms" component={StudyRoomsScreen} options={{ title: 'Study Rooms' }} />
      <Stack.Screen name="PhotoFeed" component={PhotoFeedScreen} options={{ title: 'Proof Feed' }} />
      <Stack.Screen name="WalkTalk" component={WalkTalkScreen} options={{ title: 'Walk & Talk' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function SocialStack() {
  const screenDefaults = useScreenDefaults();
  return (
    <Stack.Navigator screenOptions={screenDefaults}>
      <Stack.Screen name="Circles" component={CirclesScreen} options={{ title: 'Circles' }} />
      <Stack.Screen name="CircleDetail" component={CircleDetailScreen} options={({ route }: { route: any }) => ({ title: route.params?.circleName || 'Circle' })} />
      <Stack.Screen name="CreateCircle" component={CreateCircleScreen} options={{ title: 'New Circle' }} />
      <Stack.Screen name="JoinCircle" component={JoinCircleScreen} options={{ title: 'Join Circle' }} />
      <Stack.Screen name="CircleChat" component={CircleChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.circleName ? `${route.params.circleName}` : 'Chat' })} />
      <Stack.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Discover People' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
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
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  centerPill: { width: 42, height: 42, borderRadius: 21, top: -6 },
});

function MainTabs() {
  const mode = useThemeStore((s) => s.mode);
  const colors = themes[mode];

  return (
    <Tab.Navigator
      initialRouteName="HubTab"
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
      <Tab.Screen name="EventsTab" component={EventsStack} options={{
        title: 'Events',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="BeaconsTab" component={BeaconsStack} options={{
        title: 'Map',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="HubTab" component={HubStack} options={{
        title: 'Hub',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'flash' : 'flash-outline'} focused={focused} color={color} isCenter />,
      }} />
      <Tab.Screen name="SocialTab" component={SocialStack} options={{
        title: 'Social',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{
        title: 'You',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />,
      }} />
    </Tab.Navigator>
  );
}

export default function DevNavigator() {
  const user = useAuthStore((s) => s.user);
  const { showNudge, dismissNudge } = useScreenTime();
  const loadTheme = useThemeStore((s) => s.load);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const navTheme = useNavTheme();

  useEffect(() => {
    loadTheme();
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
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {content}
      </NavigationContainer>
      <AchievementToast />
      <ScreenTimeNudge visible={showNudge} onDismiss={dismissNudge} />
    </View>
  );
}
