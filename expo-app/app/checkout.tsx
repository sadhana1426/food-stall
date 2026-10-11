import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../src/theme';
import { useCartStore } from '../src/store/useCartStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useCurrentOrderStore } from '../src/store/useCurrentOrderStore';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { SecondaryButton } from '../src/components/common/SecondaryButton';
import { formatMoney, calculateDiscount, calculateTax, DiscountType } from '../src/utils/money';
import { ordersApi } from '../src/api/ordersApi';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getSubtotalPaise } = useCartStore();
  const { defaultOrderType, tax: taxSettings, defaultDiscountPercent, setDefaultDiscountPercent } = useSettingsStore();
  const { setCurrentOrder } = useCurrentOrderStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
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
  
  // Frontend preview calculations
  const discountType: DiscountType = defaultDiscountPercent > 0 ? 'PERCENTAGE' : 'NONE';
  const discountValue = defaultDiscountPercent;
  const discountAmountPaise = calculateDiscount(subtotalPaise, discountType, discountValue);
  const taxableAmountPaise = subtotalPaise - discountAmountPaise;
  const taxAmountPaise = calculateTax(taxableAmountPaise, taxSettings.rate, taxSettings.isEnabled);
  const grandTotalPaise = taxableAmountPaise + taxAmountPaise;

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
          type: discountType,
          value: discountValue
        }
      });
      
      setCurrentOrder(serverOrder);
      router.replace({ pathname: '/bill-preview', params: { orderId: serverOrder._id, autoPrint: 'true' } });
    } catch (err: any) {
      setError(err.message || 'Unable to generate bill. Check connection and retry.');
      setIsGenerating(false);
    }
  };

  const discountOptions = [0, 5, 10, 15];

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
          
          <TouchableOpacity 
            style={styles.summaryRowInteractive}
            onPress={() => !isGenerating && setShowDiscountModal(true)}
            disabled={isGenerating}
          >
            <Text style={styles.summaryLabelDiscount}>Discount {discountValue > 0 ? `(${discountValue}%)` : ''}</Text>
            <View style={styles.discountRight}>
              <Text style={styles.summaryValueDiscount}>
                {discountAmountPaise > 0 ? `-₹${formatMoney(discountAmountPaise)}` : 'Add'}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {taxSettings.isEnabled && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({taxSettings.rate}%)</Text>
              <Text style={styles.summaryValue}>+₹{formatMoney(taxAmountPaise)}</Text>
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

      <Modal visible={showDiscountModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Discount</Text>
              <TouchableOpacity onPress={() => setShowDiscountModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.discountOptions}>
              {discountOptions.map(pct => (
                <TouchableOpacity 
                  key={pct}
                  style={[styles.discountBtn, defaultDiscountPercent === pct && styles.discountBtnActive]}
                  onPress={() => {
                    setDefaultDiscountPercent(pct);
                    setShowDiscountModal(false);
                  }}
                >
                  <Text style={[styles.discountBtnText, defaultDiscountPercent === pct && styles.discountBtnTextActive]}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  summaryRowInteractive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
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
  summaryLabelDiscount: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
  discountRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryValueDiscount: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginRight: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  discountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  discountBtn: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  discountBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discountBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
  },
  discountBtnTextActive: {
    color: colors.white,
  },
});
