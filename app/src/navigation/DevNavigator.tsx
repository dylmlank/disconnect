import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useScreenTime } from '../hooks/useScreenTime';
import ScreenTimeNudge from '../components/ScreenTimeNudge';

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

// Auth screens (for create profile if needed)
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

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

const headerOptions = { headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' };

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="EventList" component={EventListScreen} options={{ title: 'Events' }} />
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

export default function DevNavigator() {
  const user = useAuthStore((s) => s.user);
  const { showNudge, dismissNudge } = useScreenTime();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  let content;
  if (!user) {
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
