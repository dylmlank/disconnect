import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { CLERK_PUBLISHABLE_KEY } from './src/constants/config';
import { useThemeStore } from './src/store/themeStore';
import DevApp from './src/DevApp';

let ClerkApp: React.ComponentType | null = null;
if (CLERK_PUBLISHABLE_KEY) {
  ClerkApp = require('./src/ClerkApp').default;
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);

  // In dev without Clerk keys, bypass auth entirely
  if (!ClerkApp || __DEV__) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <DevApp />
      </>
    );
  }

  return <ClerkApp />;
}
