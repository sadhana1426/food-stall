import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatMoney } from '../../utils/money';

interface Props {
  totalItems: number;
  totalPricePaise: number;
  onViewCart: () => void;
}

export const CartSummaryBar = ({ totalItems, totalPricePaise, onViewCart }: Props) => {
  return (
    <View style={styles.cartSummaryWrapper}>
      <TouchableOpacity 
        style={styles.cartSummary}
        onPress={onViewCart}
        activeOpacity={0.9}
      >
        <Text style={styles.cartSummaryText}>
          {totalItems} Items | ₹{formatMoney(totalPricePaise)}
        </Text>
        <Text style={styles.cartSummaryAction}>
          VIEW CART
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cartSummaryWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'transparent',
  },
  cartSummary: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.medium,
  },
  cartSummaryText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
  cartSummaryAction: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
