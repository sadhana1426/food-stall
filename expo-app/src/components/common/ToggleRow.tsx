import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ToggleRow = ({ title, subtitle, value, onValueChange }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.textContent}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  textContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
});
