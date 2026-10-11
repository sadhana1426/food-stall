import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { colors, spacing, typography, radius } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!email.trim() || !email.includes('@')) return;
    router.push({ pathname: '/(auth)/password', params: { email: email.trim().toLowerCase() } });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.headerDecoration}>
          <AuthHero 
            variant="login-email" 
            title="Tasty Bites" 
            subtitle="Premium Point of Sale for Modern Food Businesses" 
          />
        </View>
        
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Enter your email to access your business</Text>
            
            <AppTextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              placeholder="e.g. owner@restaurant.com"
            />
            
            <View style={styles.continueButton}>
              <PrimaryButton 
                label="Continue"
                onPress={handleContinue}
                disabled={!email.includes('@') || isLoading}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.secondaryText}>New to Tasty Bites?</Text>
          <TouchableOpacity 
            style={styles.createAccountBtn} 
            onPress={() => router.push('/(auth)/signup')}
            disabled={isLoading}
          >
            <Text style={styles.createAccountText}>Create Business Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  headerDecoration: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 80, // Extra space at bottom so card can overlap without covering text
    alignItems: 'center',
  },
  content: { 
    padding: spacing.lg, 
    marginTop: -60, // overlap the card onto the empty space of the header
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  footer: { 
    padding: spacing.xl, 
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  secondaryText: { 
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.size.md,
  },
  createAccountBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  createAccountText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  }
});
