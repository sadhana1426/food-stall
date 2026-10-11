import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  category: string;
  isSelected: boolean;
  onPress: () => void;
}

export const CategoryChip = ({ category, isSelected, onPress }: Props) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        isSelected && styles.categoryChipSelected
      ]}
      onPress={onPress}
    >
      <Text 
        style={[
          styles.categoryText,
          isSelected && styles.categoryTextSelected
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryChip: {
    paddingHorizontal: spacing.lg,
    height: 44,
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  categoryTextSelected: {
    color: colors.white,
  },
});
