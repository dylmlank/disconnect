const DEV_HOST = '192.168.68.115:4500';

export const API_URL = __DEV__ ? `http://${DEV_HOST}/api` : 'https://api.disconnect.app/api';
export const WS_URL = __DEV__ ? `ws://${DEV_HOST}/ws` : 'wss://api.disconnect.app/ws';

// Clerk
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
