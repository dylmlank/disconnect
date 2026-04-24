import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { CLERK_PUBLISHABLE_KEY } from './src/constants/config';
import DevApp from './src/DevApp';

let ClerkApp: React.ComponentType | null = null;
if (CLERK_PUBLISHABLE_KEY) {
  ClerkApp = require('./src/ClerkApp').default;
}

export default function App() {
  // In dev without Clerk keys, bypass auth entirely
  if (!ClerkApp || __DEV__) {
    return (
      <>
        <StatusBar style="light" />
        <DevApp />
      </>
    );
  }

  return <ClerkApp />;
}
