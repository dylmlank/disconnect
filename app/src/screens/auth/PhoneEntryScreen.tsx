import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export default function PhoneEntryScreen({ navigation }: { navigation: any }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const handleSend = async () => {
    if (!phone.startsWith('+') || phone.length < 8) {
      Alert.alert('Invalid phone', 'Enter your phone number in international format (e.g., +15551234567)');
      return;
    }
    if (!signInLoaded || !signUpLoaded) return;

    setLoading(true);
    try {
      // Try sign-in first (existing user)
      const { supportedFirstFactors } = await signIn.create({ identifier: phone });
      const phoneFactor = supportedFirstFactors?.find(
        (f: any) => f.strategy === 'phone_code' && f.phoneNumberId,
      ) as any;

      if (phoneFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneFactor.phoneNumberId,
        });
        navigation.navigate('VerifyCode', { phone, mode: 'sign_in' });
      }
    } catch (err: any) {
      // If user doesn't exist, Clerk returns an error — switch to sign-up
      if (err?.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          await signUp.create({ phoneNumber: phone });
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
          navigation.navigate('VerifyCode', { phone, mode: 'sign_up' });
        } catch {
          Alert.alert('Error', 'Failed to send verification code. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disconnect</Text>
      <Text style={styles.subtitle}>Less screen time. More real life.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Your phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 123 4567"
          placeholderTextColor="#555"
          keyboardType="phone-pad"
          autoComplete="tel"
          autoFocus
        />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSend} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Code'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        {"We'll send you a verification code. We never share your phone number."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 48 },
  form: { gap: 16 },
  label: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 18,
    color: '#fff', borderWidth: 1, borderColor: '#333',
  },
  button: {
    backgroundColor: '#4ade80', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  disclaimer: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 24 },
});
