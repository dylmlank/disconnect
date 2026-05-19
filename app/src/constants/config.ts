import { Platform } from 'react-native';

// Use localhost for web, LAN IP for native devices
const DEV_HOST = Platform.OS === 'web' ? 'localhost:3000' : '192.168.68.115:3000';

export const API_URL = __DEV__ ? `http://${DEV_HOST}/api` : 'https://api.disconnect.app/api';
export const WS_URL = __DEV__ ? `ws://${DEV_HOST}/ws` : 'wss://api.disconnect.app/ws';

// Clerk
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
