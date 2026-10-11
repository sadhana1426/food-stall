import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MenuItem } from '../../types';
import { QuantitySelector } from './QuantitySelector';
import { formatMoney } from '../../utils/money';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Snacks': return 'fastfood';
    case 'Meals': return 'restaurant';
    case 'Beverages': return 'local-cafe';
    default: return 'restaurant-menu';
  }
};

export const MenuItemCard = ({ item, quantity, onAdd, onDecrease }: Props) => {
  return (
    <View style={styles.card}>
      {item.image?.url ? (
        <Image source={{ uri: item.image.url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialIcons name={getCategoryIcon(item.category) as any} size={36} color={colors.primary + '80'} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{formatMoney(item.pricePaise)}</Text>
        
        {quantity === 0 ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAdd}
          >
            <Text style={styles.addButtonText}>+ ADD</Text>
          </TouchableOpacity>
        ) : (
          <QuantitySelector quantity={quantity} onIncrease={onAdd} onDecrease={onDecrease} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '48%',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  image: {
    height: 80,
    width: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 80,
    backgroundColor: colors.primary + '0D',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: spacing.md,
  },
  itemName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary + '1A',
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
