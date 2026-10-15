import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../src/theme';
import { useCartStore } from '../src/store/useCartStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useCurrentOrderStore } from '../src/store/useCurrentOrderStore';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { SecondaryButton } from '../src/components/common/SecondaryButton';
import { formatMoney, calculateTax } from '../src/utils/money';
import { ordersApi } from '../src/api/ordersApi';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getSubtotalPaise } = useCartStore();
  const { defaultOrderType, tax: taxSettings } = useSettingsStore();
  const { setCurrentOrder } = useCurrentOrderStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Idempotency key per checkout attempt
  const [clientOrderId] = useState(() => Date.now().toString() + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    if (items.length === 0 && !isGenerating) {
      router.replace('/(tabs)/billing');
    }
  }, [items, isGenerating]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/cart');
    }
  };

  const subtotalPaise = getSubtotalPaise();
  const taxAmountPaise = calculateTax(subtotalPaise, taxSettings.rate, taxSettings.isEnabled);
  const grandTotalPaise = subtotalPaise + taxAmountPaise;

  const handleGenerateBill = async () => {
    if (items.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    const orderItems = items.map(i => ({
      menuItemId: i.menuItem.id,
      quantity: i.quantity,
    }));

    try {
      const serverOrder = await ordersApi.createOrder({
        clientOrderId,
        orderType: defaultOrderType === 'Takeaway' ? 'TAKEAWAY' : 'DINE_IN',
        items: orderItems,
        discount: {
          type: 'NONE',
          value: 0
        }
      });
      
      const currentBusiness = useSettingsStore.getState().business;
      const completeOrder = {
        ...serverOrder,
        receiptFooterSnapshot: serverOrder.businessSnapshot?.receiptFooter || currentBusiness?.receiptFooter || 'Thank You! Visit Again.',
        businessSnapshot: serverOrder.businessSnapshot || {
          name: currentBusiness?.name || 'The Punjab Delight Co.',
          address: currentBusiness?.address || '',
          phone: currentBusiness?.phone || '',
          receiptFooter: currentBusiness?.receiptFooter || 'Thank You! Visit Again.',
        }
      };
      
      setCurrentOrder(completeOrder);
      router.replace({ pathname: '/bill-preview', params: { orderId: serverOrder._id, autoPrint: 'true' } });
    } catch (err: any) {
      setError(err.message || 'Unable to generate bill. Check connection and retry.');
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isGenerating}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <Text style={styles.cardBadge}>{defaultOrderType}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{formatMoney(subtotalPaise)}</Text>
          </View>

          {taxSettings.isEnabled && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({taxSettings.rate}%)</Text>
              <Text style={styles.summaryValue}>₹{formatMoney(taxAmountPaise)}</Text>
            </View>
          )}

          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Grand Total (Preview)</Text>
            <Text style={styles.grandTotalValue}>₹{formatMoney(grandTotalPaise)}</Text>
          </View>
          
          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton 
          label="EDIT ORDER" 
          onPress={handleBack}
          disabled={isGenerating}
        />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton 
          label={isGenerating ? "GENERATING..." : "GENERATE BILL"} 
          onPress={handleGenerateBill} 
          disabled={items.length === 0 || isGenerating}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  cardBadge: {
    backgroundColor: colors.primary + '1A',
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.size.md,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
