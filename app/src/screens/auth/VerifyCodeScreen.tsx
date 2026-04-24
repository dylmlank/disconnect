import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export default function VerifyCodeScreen({ route }: { route: any }) {
  const { phone, mode } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign_in') {
        const result = await signIn!.attemptFirstFactor({ strategy: 'phone_code', code });
        if (result.status === 'complete') {
          await setSignInActive!({ session: result.createdSessionId });
          // Clerk's isSignedIn will flip, RootNavigator handles the rest
        }
      } else {
        const result = await signUp!.attemptPhoneNumberVerification({ code });
        if (result.status === 'complete') {
          await setSignUpActive!({ session: result.createdSessionId });
          // New user — RootNavigator will show CreateProfile screen
        }
      }
    } catch {
      Alert.alert('Error', 'Incorrect code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        placeholderTextColor="#555"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        textAlign="center"
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 32,
    color: '#fff', borderWidth: 1, borderColor: '#333', letterSpacing: 12,
  },
  button: {
    backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
