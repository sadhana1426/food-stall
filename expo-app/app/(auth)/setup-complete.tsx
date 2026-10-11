import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { colors, spacing } from '../../src/theme';

export default function SetupCompleteScreen() {
  const router = useRouter();

  const handleDone = () => {
    router.replace('/(tabs)/billing');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="setup-complete" title="Your business is ready!" subtitle="Your Tasty Bites account has been set up successfully." />
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label="Go to Billing"
          onPress={handleDone}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
