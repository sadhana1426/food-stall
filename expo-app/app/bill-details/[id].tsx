import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { usePrinterStore } from '../../src/store/usePrinterStore';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatMoney } from '../../src/utils/money';
import { formatDateTimeAscii } from '../../src/services/printer/ReceiptFormatter';
import { ordersApi } from '../../src/api/ordersApi';
import { reportsApi } from '../../src/api/reportsApi';
import * as Sharing from 'expo-sharing';

export default function BillDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reprintOrder } = usePrinterStore();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError('No bill ID provided.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrder(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load bill details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/history');
    }
  };

  const handleDownload = async () => {
    if (!order) return;
    try {
      const orderDbId = order._id || order.id;
      const uri = await reportsApi.downloadOrderPdf(orderDbId);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Report Downloaded', `Report saved to ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('Download Error', err.message || 'Unable to download report.');
    }
  };

  const handleReprint = async () => {
    if (!order || isPrinting) return;
    setIsPrinting(true);
    const result = await reprintOrder(order);
    setIsPrinting(false);

    if (result.success) {
      if (result.updatedOrder) {
        setOrder(result.updatedOrder);
      }
      Alert.alert('Reprint Successful', 'Bill reprinted successfully.');
    } else if (result.status === 'NO_PRINTER') {
      Alert.alert(
        'No printer selected',
        'Please select and pair a thermal printer before reprinting.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Printer Setup', onPress: () => router.push('/settings/printer') },
        ]
      );
    } else if (result.status === 'DISCONNECTED') {
      Alert.alert(
        'Printer not connected',
        'Printer is disconnected. Would you like to connect and reprint?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect & Reprint', onPress: () => handleReprint() },
        ]
      );
    } else {
      Alert.alert(
        'Receipt could not be sent to printer.',
        'Please check that printer is turned on and in range, then retry.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry Reprint', onPress: () => handleReprint() },
        ]
      );
    }
  };

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <EmptyState icon="error-outline" title="Unable to load bill" subtitle={error} />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
               <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} 
              onPress={() => router.replace('/(tabs)/history')}
            >
               <Text style={[styles.retryText, { color: colors.text.primary }]}>Back to History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
        <View style={{ width: 24 }} />
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
            <Text style={styles.footerText}>Thank You! Visit Again.</Text>
          </View>
        </View>
        
        <Text style={styles.printCountText}>
          Printed {order.printCount || 0} {(order.printCount || 0) === 1 ? 'time' : 'times'}
        </Text>
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <MaterialIcons name="file-download" size={20} color={colors.primary} />
          <Text style={styles.downloadButtonText}>DOWNLOAD PDF</Text>
        </TouchableOpacity>
        <PrimaryButton 
          label={isPrinting ? "PRINTING..." : "REPRINT BILL"} 
          onPress={handleReprint}
          disabled={isPrinting}
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
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
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
  printCountText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing.lg,
    fontSize: typography.size.sm,
  },
  footerActions: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '1A',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  downloadButtonText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
  },
});
