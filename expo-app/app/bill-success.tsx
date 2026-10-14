import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, BackHandler, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../src/theme';
import { useCurrentOrderStore } from '../src/store/useCurrentOrderStore';
import { useCartStore } from '../src/store/useCartStore';
import { usePrinterStore } from '../src/store/usePrinterStore';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { SecondaryButton } from '../src/components/common/SecondaryButton';
import { formatMoney } from '../src/utils/money';

export default function BillSuccessScreen() {
  const router = useRouter();
  const { orderId, printSuccess } = useLocalSearchParams<{ orderId: string, printSuccess: string }>();
  const { currentOrder, clearCurrentOrder } = useCurrentOrderStore();
  const { clearCart } = useCartStore();
  const { printOrder } = usePrinterStore();

  // Keep snapshot of currentOrder so clearing order doesn't break rendering or navigation
  const [orderSnapshot] = useState<any>(() => currentOrder);
  const effectiveOrderId = orderId || currentOrder?._id || currentOrder?.id || orderSnapshot?._id || orderSnapshot?.id;
  const order = currentOrder || orderSnapshot;
  const [isRetryingPrint, setIsRetryingPrint] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>(printSuccess);

  const printFailed = printStatus === 'false';

  useEffect(() => {
    if (!order && !effectiveOrderId) {
      router.replace('/(tabs)/billing');
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      clearCart();
      clearCurrentOrder();
      router.replace('/(tabs)/billing');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleRetryPrint = async () => {
    if (!order || isRetryingPrint) return;
    setIsRetryingPrint(true);
    try {
      const ok = await printOrder(order);
      if (ok) {
        setPrintStatus('true');
        Alert.alert('Printed', 'Receipt printed successfully.');
      } else {
        Alert.alert('Print Failed', 'Printer is still unavailable. Please check printer connection.');
      }
    } finally {
      setIsRetryingPrint(false);
    }
  };

  const handleGoToPrinterSetup = () => {
    router.push('/settings/printer');
  };

  const handleNewOrder = () => {
    clearCart();
    clearCurrentOrder();
    router.replace('/(tabs)/billing');
  };

  const handleViewBill = () => {
    const idToView = effectiveOrderId;
    clearCart();
    clearCurrentOrder();
    if (idToView) {
      router.replace({ pathname: '/bill-details/[id]', params: { id: idToView } });
    } else {
      router.replace('/(tabs)/billing');
    }
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
          {printFailed ? 'Bill Saved Successfully' : 'Bill Generated'}
        </Text>
        
        <Text style={styles.amount}>₹{formatMoney(order?.grandTotalPaise || 0)}</Text>
        
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>
            {order?.billNumber} • {order?.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}
          </Text>
        </View>
        
        {printFailed && (
          <View style={styles.failureBox}>
            <Text style={styles.warningText}>
              Printer is not connected. The bill was saved in history.
            </Text>
            <View style={styles.failureActions}>
              <TouchableOpacity 
                style={styles.retryBtn} 
                onPress={handleRetryPrint}
                disabled={isRetryingPrint}
              >
                {isRetryingPrint ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <MaterialIcons name="refresh" size={16} color={colors.white} />
                    <Text style={styles.retryBtnText}>Retry Print</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.connectBtn} 
                onPress={handleGoToPrinterSetup}
              >
                <MaterialIcons name="bluetooth" size={16} color={colors.primary} />
                <Text style={styles.connectBtnText}>Connect Printer</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  failureBox: {
    marginTop: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  warningText: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: typography.size.sm,
    marginBottom: spacing.md,
  },
  failureActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  retryBtnText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  connectBtnText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  footer: {
    padding: spacing.lg,
  },
});
