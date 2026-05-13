import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { setTokenProvider } from './services/api';
import { setWsTokenProvider } from './hooks/useWebSocket';
import { useAuthStore } from './store/authStore';
import DevNavigator from './navigation/DevNavigator';
import ErrorBoundary from './components/ErrorBoundary';

// Dev mode: skip Clerk, auto-login as seed user "Alex"
const DEV_CLERK_ID = 'dev_user_alex';

export default function DevApp() {
  const [ready, setReady] = useState(false);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    // Set a static dev token provider for both API and WebSocket
    const getDevToken = async () => `dev:${DEV_CLERK_ID}`;
    setTokenProvider(getDevToken);
    setWsTokenProvider(getDevToken);

    // Fetch the dev user's profile
    fetchMe()
      .then(() => setReady(true))
      .catch(() => setReady(true)); // still show app even if fetch fails
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <DevNavigator />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
});
