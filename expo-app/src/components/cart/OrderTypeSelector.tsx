import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  orderType: 'Dine In' | 'Takeaway';
  onOrderTypeChange: (type: 'Dine In' | 'Takeaway') => void;
}

export const OrderTypeSelector = ({ orderType, onOrderTypeChange }: Props) => {
  return (
    <View style={styles.orderTypeContainer}>
      {(['Dine In', 'Takeaway'] as const).map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.orderTypeBtn,
            orderType === type && styles.orderTypeBtnSelected
          ]}
          onPress={() => onOrderTypeChange(type)}
        >
          <Text 
            style={[
              styles.orderTypeText,
              orderType === type && styles.orderTypeTextSelected
            ]}
          >
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  orderTypeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  orderTypeBtnSelected: {
    backgroundColor: colors.primary,
  },
  orderTypeText: {
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
  },
  orderTypeTextSelected: {
    color: colors.white,
  },
});
