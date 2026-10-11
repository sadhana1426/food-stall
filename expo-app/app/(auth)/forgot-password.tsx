import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { colors, spacing, typography } from '../../src/theme';
import { authApi } from '../../src/api/authApi';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: initialEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setIsLoading(true);
    setError('');
    
    try {
      const normEmail = email.trim().toLowerCase();
      await authApi.forgotPassword({ email: normEmail });
      router.push({ pathname: '/(auth)/verify-reset-otp', params: { email: normEmail } });
    } catch (err: any) {
      setError(err.message || 'Unable to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="forgot-password" title="Forgot Password" subtitle="We'll send a code to reset your password" />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <AppTextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Sending code..." : "Send OTP"}
          onPress={handleSend}
          disabled={!email || isLoading}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.secondaryText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  form: { marginTop: spacing.md },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  secondaryText: { color: colors.text.secondary, fontWeight: typography.weight.medium },
});
