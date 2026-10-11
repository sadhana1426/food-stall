import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { colors, spacing } from '../../src/theme';
import { authApi } from '../../src/api/authApi';
import { MaterialIcons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = password.length >= 8 && password === confirmPassword;

  const handleReset = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError('');
    
    try {
      await authApi.resetPassword({ token, newPassword: password });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="reset-password" title="Reset Password" subtitle="Create a new password for your account" />

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
          label={isLoading ? "Saving..." : "Update Password"}
          onPress={handleReset}
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
