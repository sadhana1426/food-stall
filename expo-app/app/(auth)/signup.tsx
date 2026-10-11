import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { colors, spacing, typography } from '../../src/theme';
import { authApi } from '../../src/api/authApi';

export default function SignupScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = businessName.trim() && email.trim() && email.includes('@') && phone.trim() && address.trim();

  const handleSignup = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError('');
    
    try {
      const normEmail = email.trim().toLowerCase();
      await authApi.signupStart({ 
        email: normEmail, 
        businessName: businessName.trim(), 
        phone: phone.trim(), 
        address: address.trim() 
      });
      router.push({ 
        pathname: '/(auth)/verify-signup-otp', 
        params: { email: normEmail, businessName, phone, address } 
      });
    } catch (err: any) {
      setError(err.message || 'Unable to start signup process.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthHero variant="signup" title="Create your account" subtitle="Join Tasty Bites today" />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <AppTextInput
            label="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            editable={!isLoading}
          />
          <AppTextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <AppTextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          <AppTextInput
            label="Business Address"
            value={address}
            onChangeText={setAddress}
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Sending code..." : "Verify Email"}
          onPress={handleSignup}
          disabled={!isValid || isLoading}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.secondaryText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  form: { marginTop: spacing.md },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  secondaryText: { color: colors.text.secondary, fontWeight: typography.weight.medium },
});
