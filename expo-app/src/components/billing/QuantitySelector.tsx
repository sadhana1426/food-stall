import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme';

interface Props {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const QuantitySelector = ({ quantity, onIncrease, onDecrease }: Props) => {
  return (
    <View style={styles.quantityContainer}>
      <TouchableOpacity 
        style={styles.qtyButton}
        onPress={onDecrease}
      >
        <MaterialIcons name="remove" size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.qtyText}>{quantity}</Text>
      <TouchableOpacity 
        style={[styles.qtyButton, styles.qtyButtonPlus]}
        onPress={onIncrease}
      >
        <MaterialIcons name="add" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonPlus: {
    backgroundColor: colors.primary,
  },
  qtyText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    minWidth: 32,
    textAlign: 'center',
  },
});
