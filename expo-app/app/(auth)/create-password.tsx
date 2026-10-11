import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { colors, spacing, typography } from '../../src/theme';
import { authApi } from '../../src/api/authApi';
import { useAuthStore } from '../../src/store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { token, businessName, phone, address } = useLocalSearchParams<{ token: string, businessName: string, phone: string, address: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const isValid = password.length >= 8 && password === confirmPassword;

  const handleCreate = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError('');
    
    try {
      const data = await authApi.signupComplete({ token, password, businessName, phone, address });
      await login({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.replace('/(auth)/business-setup');
    } catch (err: any) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="create-password" title="Secure your account" subtitle="Create a strong password" />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <View style={styles.passwordContainer}>
            <AppTextInput
              label="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              style={{ paddingRight: 50 }}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <AppTextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Creating account..." : "Complete Signup"}
          onPress={handleCreate}
          disabled={!isValid || isLoading}
        />
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
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
