import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const SecondaryButton = ({ label, onPress, disabled = false }: Props) => {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
  buttonTextDisabled: {
    color: colors.text.secondary,
  }
});
