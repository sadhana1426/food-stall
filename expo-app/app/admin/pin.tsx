import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { adminApi } from '../../src/api/adminApi';
import { useAdminSessionStore } from '../../src/store/useAdminSessionStore';

export default function AdminPinScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { setSession } = useAdminSessionStore();

  const handleVerify = async () => {
    if (password.length < 1) return;
    setIsVerifying(true);
    setError('');

    try {
      const response = await adminApi.verifyPassword(password);
      setSession(response.token);
      if (next) {
        router.replace(next as any);
      } else {
        handleBack();
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect password. Please try again.');
      setPassword('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isVerifying}>
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="lock" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Admin Access</Text>
          <Text style={styles.subtitle}>Enter your password to continue</Text>

          <View style={styles.inputContainer}>
            <AppTextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              error={error}
              style={styles.pinInput}
              autoFocus
              editable={!isVerifying}
            />
          </View>
          {isVerifying && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />}
        </View>

        <View style={styles.footer}>
          <PrimaryButton 
            label={isVerifying ? "VERIFYING..." : "VERIFY"} 
            onPress={handleVerify}
            disabled={password.length < 1 || isVerifying}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  pinInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
  },
  footer: {
    padding: spacing.lg,
  },
});
