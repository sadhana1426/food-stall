import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { colors, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { authApi } from '../../src/api/authApi';
import { MaterialIcons } from '@expo/vector-icons';

export default function PasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!password) return;
    setIsLoading(true);
    setError('');
    
    try {
      const data = await authApi.login({ email, password });
      await login({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      if (data.setupCompleted) {
        router.replace('/(tabs)/billing');
      } else {
        router.replace('/(auth)/business-setup');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="login-password" title="Welcome back" subtitle={email} />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <View style={styles.passwordContainer}>
            <AppTextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              style={{ paddingRight: 50 }}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { email } })}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Signing in..." : "Log in"}
          onPress={handleLogin}
          disabled={!password || isLoading}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.secondaryText}>Use a different email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  form: { marginTop: spacing.md },
  passwordContainer: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: spacing.md, top: 40 },
  forgotPassword: { textAlign: 'right', color: colors.primary, fontWeight: typography.weight.medium, marginTop: spacing.xs },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  secondaryText: { color: colors.text.secondary, fontWeight: typography.weight.medium },
});
