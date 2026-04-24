export const API_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.disconnect.app/api';
export const WS_URL = __DEV__ ? 'ws://localhost:3000/ws' : 'wss://api.disconnect.app/ws';

// Clerk
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
