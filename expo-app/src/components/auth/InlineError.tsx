import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  message?: string | null;
}

export const InlineError = ({ message }: Props) => {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={16} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.error,
    fontSize: typography.size.sm,
    marginLeft: spacing.xs,
    flex: 1,
  },
});
