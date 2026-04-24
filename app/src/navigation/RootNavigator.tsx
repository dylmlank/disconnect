import React, { useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../store/authStore';
import { setTokenProvider } from '../services/api';
import { useScreenTime } from '../hooks/useScreenTime';
import { useNotifications } from '../hooks/useNotifications';
import ScreenTimeNudge from '../components/ScreenTimeNudge';

// Auth screens
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

// Event screens
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventChatScreen from '../screens/events/EventChatScreen';

// Beacon screens
import BeaconMapScreen from '../screens/beacons/BeaconMapScreen';
import CreateBeaconScreen from '../screens/beacons/CreateBeaconScreen';

// Profile screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import BlockedUsersScreen from '../screens/profile/BlockedUsersScreen';

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
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
      <Stack.Screen name="EventChat" component={EventChatScreen} options={({ route }: { route: any }) => ({ title: route.params?.title || 'Chat' })} />
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
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
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

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  // Three-state routing:
  // 1. Not signed in → AuthStack (phone entry + verify code)
  // 2. Signed in but no profile → CreateProfile
  // 3. Signed in with profile → MainTabs
  let content;
  if (!isSignedIn) {
    content = <AuthStack />;
  } else if (!user) {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      </Stack.Navigator>
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

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
});
