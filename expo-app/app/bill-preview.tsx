import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../src/theme';
import { useCurrentOrderStore } from '../src/store/useCurrentOrderStore';
import { usePrinterStore } from '../src/store/usePrinterStore';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { formatMoney } from '../src/utils/money';
import { formatDateTimeAscii, resolveReceiptFooter } from '../src/services/printer/ReceiptFormatter';
import { ordersApi } from '../src/api/ordersApi';

export default function BillPreviewScreen() {
  const router = useRouter();
  const { orderId, autoPrint } = useLocalSearchParams<{ orderId: string, autoPrint: string }>();
  const { currentOrder } = useCurrentOrderStore();
  const { connectionState, printOrder, autoPrint: settingAutoPrint } = usePrinterStore();

  const [isPrinting, setIsPrinting] = useState(false);

  // Use the transient order for preview
  const order = currentOrder?._id === orderId ? currentOrder : null;

  useEffect(() => {
    if (!order) {
      router.replace('/(tabs)/billing');
      return;
    }
    // Handle Auto Print
    if (autoPrint === 'true' && settingAutoPrint && !isPrinting && (order.printCount || 0) === 0) {
      handlePrint();
    }
  }, [order, autoPrint, settingAutoPrint]);

  if (!order) {
    return null;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/billing');
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    const success = await printOrder(order);
    setIsPrinting(false);
    
    // Always go to success screen, it will handle printer failure messaging
    router.replace({ pathname: '/bill-success', params: { orderId: order._id, printSuccess: success ? 'true' : 'false' } });
  };

  const handleSkipPrint = () => {
    router.replace({ pathname: '/bill-success', params: { orderId: order._id, printSuccess: 'skipped' } });
  };

  const isPrinterConnected = connectionState === 'CONNECTED' || connectionState === 'CONNECTING';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bill Preview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.receipt}>
          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.businessName}>{order.businessSnapshot.name}</Text>
            {order.businessSnapshot.address ? <Text style={styles.businessDetail}>{order.businessSnapshot.address}</Text> : null}
            {order.businessSnapshot.phone ? <Text style={styles.businessDetail}>Ph: {order.businessSnapshot.phone}</Text> : null}
            
            <View style={styles.dividerDashed} />
            
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{order.billNumber}</Text>
              <Text style={styles.metaText}>{order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Date: {formatDateTimeAscii(order.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.dividerDashed} />

          {/* Items Header */}
          <View style={styles.itemHeader}>
            <Text style={[styles.itemHeaderText, { flex: 2 }]}>Item</Text>
            <Text style={[styles.itemHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.itemHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>

          <View style={styles.dividerDashed} />

          {/* Items */}
          {order.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={2}>{item.itemName || item.name}</Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}>{formatMoney(item.lineTotalPaise)}</Text>
            </View>
          ))}

          <View style={styles.dividerDashed} />

          {/* Totals */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatMoney(order.subtotalPaise)}</Text>
          </View>

          {order.taxAmountPaise > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({order.taxRate}%)</Text>
              <Text style={styles.summaryValue}>{formatMoney(order.taxAmountPaise)}</Text>
            </View>
          )}

          <View style={styles.dividerDashed} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalText}>TOTAL</Text>
            <Text style={styles.grandTotalAmount}>₹{formatMoney(order.grandTotalPaise)}</Text>
          </View>

          <View style={styles.dividerDashed} />
          
          <View style={styles.receiptFooter}>
            <Text style={styles.footerText}>{resolveReceiptFooter(order)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.textButton} onPress={handleSkipPrint} disabled={isPrinting}>
          <Text style={styles.textButtonLabel}>SKIP PRINTING</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <PrimaryButton 
            label={isPrinting ? "PRINTING..." : "PRINT BILL"} 
            onPress={handlePrint}
            disabled={isPrinting}
          />
        </View>
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
    padding: spacing.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
  },
  receipt: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.md,
    ...shadows.medium,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  businessName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  businessDetail: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  dividerDashed: {
    height: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    width: '100%',
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  itemHeader: {
    flexDirection: 'row',
  },
  itemHeaderText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  grandTotalAmount: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  receiptFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.error,
    textAlign: 'center',
    margin: spacing.xl,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textButton: {
    padding: spacing.md,
  },
  textButtonLabel: {
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
