import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export type FoodVisualVariant = 
  | 'login-email'
  | 'login-password'
  | 'forgot-password'
  | 'reset-otp'
  | 'reset-password'
  | 'signup'
  | 'signup-otp'
  | 'create-password'
  | 'business-setup'
  | 'setup-complete';

interface Props {
  variant: FoodVisualVariant;
  title: string;
  subtitle?: string;
}

export const AuthHero = ({ variant, title, subtitle }: Props) => {
  const getVisual = () => {
    switch (variant) {
      case 'login-email': return '☕🥞'; // Filter Coffee + Dosa
      case 'login-password': return '🍩🍛'; // Vada + Idli
      case 'forgot-password': return '☕🍪'; // Tea + Biscuits
      case 'reset-otp': return '🥟🟢'; // Samosa + Chutney
      case 'reset-password': return '🌯🥗'; // Roll
      case 'signup': return '🍛🥘🥣'; // Thali
      case 'signup-otp': return '🍋🧊'; // Lemon soda
      case 'create-password': return '🍲🍚'; // Biryani
      case 'business-setup': return '🌶️🧾🧮'; // Spices + Receipt
      case 'setup-complete': return '🎉🍽️✅'; // Celebration
      default: return '🍽️';
    }
  };

  const isLogin = variant === 'login-email';

  return (
    <View style={styles.container}>
      <View style={styles.visualContainer}>
        <Text style={styles.visual}>{getVisual()}</Text>
      </View>
      <Text style={[styles.title, isLogin && styles.titleDark]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, isLogin && styles.subtitleDark]}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  visualContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  visual: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  titleDark: {
    color: colors.surface,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  subtitleDark: {
    color: '#D1FAE5', // Light green tailwind color
  }
});
