import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../src/theme';
import { useCurrentOrderStore } from '../src/store/useCurrentOrderStore';
import { useCartStore } from '../src/store/useCartStore';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { SecondaryButton } from '../src/components/common/SecondaryButton';
import { formatMoney } from '../src/utils/money';

export default function BillSuccessScreen() {
  const router = useRouter();
  const { orderId, printSuccess } = useLocalSearchParams<{ orderId: string, printSuccess: string }>();
  const { currentOrder, clearCurrentOrder } = useCurrentOrderStore();
  const { clearCart } = useCartStore();

  const order = (currentOrder?._id === orderId || currentOrder?.id === orderId) ? currentOrder : null;
  const printFailed = printSuccess === 'false';

  useEffect(() => {
    if (!order) {
      router.replace('/(tabs)/billing');
    }
  }, [order]);

  useEffect(() => {
    const onBackPress = () => {
      clearCart();
      clearCurrentOrder();
      router.dismissAll();
      router.replace('/(tabs)/billing');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  if (!order) {
    return null;
  }

  const handleNewOrder = () => {
    clearCart();
    clearCurrentOrder();
    router.dismissAll();
    router.replace('/(tabs)/billing');
  };

  const handleViewBill = () => {
    clearCart();
    clearCurrentOrder();
    router.dismissAll();
    const orderIdToView = order.id || order._id || '';
    router.replace({ pathname: '/bill-details/[id]', params: { id: orderIdToView } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, printFailed && styles.iconCircleWarning]}>
          <MaterialIcons 
            name={printFailed ? 'print-disabled' : 'check'} 
            size={48} 
            color={printFailed ? colors.accent : colors.primary} 
          />
        </View>
        
        <Text style={styles.title}>
          {printFailed ? 'Bill Saved, Print Failed' : 'Bill Generated'}
        </Text>
        
        <Text style={styles.amount}>₹{formatMoney(order.grandTotalPaise)}</Text>
        
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>
            {order.billNumber} • {order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
          </Text>
        </View>
        
        {printFailed && (
          <Text style={styles.warningText}>
            Printer was unavailable or encountered an error. The bill is saved in history.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <SecondaryButton 
          label="VIEW BILL" 
          onPress={handleViewBill} 
        />
        <View style={{ height: spacing.md }} />
        <PrimaryButton 
          label="NEW ORDER" 
          onPress={handleNewOrder} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconCircleWarning: {
    backgroundColor: colors.accent + '1A',
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  amount: {
    fontSize: 40,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  metaBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  warningText: {
    marginTop: spacing.xl,
    textAlign: 'center',
    color: colors.accent,
    fontSize: typography.size.sm,
  },
  footer: {
    padding: spacing.lg,
  },
});
