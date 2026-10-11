import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../src/theme';
import { useCartStore } from '../src/store/useCartStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { OrderTypeSelector } from '../src/components/cart/OrderTypeSelector';
import { EmptyState } from '../src/components/common/EmptyState';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { QuantitySelector } from '../src/components/billing/QuantitySelector';
import { formatMoney } from '../src/utils/money';

export default function CartScreen() {
  const router = useRouter();
  const { items, addItem, decreaseQuantity, getSubtotalPaise } = useCartStore();
  const { defaultOrderType, setDefaultOrderType } = useSettingsStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/billing');
    }
  };

  const subtotalPaise = getSubtotalPaise();

  const renderCartItem = ({ item }: { item: any }) => {
    const lineTotalPaise = item.menuItem.pricePaise * item.quantity;
    
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.menuItem.name}</Text>
          <Text style={styles.itemPrice}>
            ₹{formatMoney(item.menuItem.pricePaise)} × {item.quantity} = <Text style={styles.itemLineTotal}>₹{formatMoney(lineTotalPaise)}</Text>
          </Text>
        </View>
        <QuantitySelector 
          quantity={item.quantity} 
          onIncrease={() => addItem(item.menuItem)} 
          onDecrease={() => decreaseQuantity(item.menuItem.id)} 
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <OrderTypeSelector orderType={defaultOrderType} onOrderTypeChange={setDefaultOrderType} />

      {items.length === 0 ? (
        <EmptyState 
          icon="shopping-basket" 
          title="Your cart is empty" 
          subtitle="Add some items to start an order." 
          actionLabel="BROWSE MENU" 
          onAction={handleBack} 
        />
      ) : (
        <>
          <FlatList
            style={{ flex: 1 }}
            data={items}
            keyExtractor={item => item.menuItem.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{formatMoney(subtotalPaise)}</Text>
            </View>
            <PrimaryButton 
              label="CONTINUE TO CHECKOUT" 
              onPress={() => router.push('/checkout')} 
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  itemName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  itemLineTotal: {
    fontWeight: typography.weight.bold,
    color: colors.accent,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.size.lg,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  summaryValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
});
