import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatMoney } from '../../src/utils/money';
import { formatDateTimeAscii } from '../../src/services/printer/ReceiptFormatter';
import { ordersApi } from '../../src/api/ordersApi';
import { usePrinterStore } from '../../src/store/usePrinterStore';
import { useFocusEffect } from 'expo-router';

export default function HistoryScreen() {
  const router = useRouter();
  const { reprintOrder, isPrinting } = usePrinterStore();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load bills.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleQuickReprint = async (item: any) => {
    const itemId = item._id || item.id;
    if (reprintingId || isPrinting) return;
    setReprintingId(itemId);

    const result = await reprintOrder(item);
    setReprintingId(null);

    if (result.success) {
      if (result.updatedOrder) {
        setOrders(prev => prev.map(o => (o._id || o.id) === itemId ? result.updatedOrder : o));
      }
      Alert.alert('Reprint Successful', `Bill #${item.billNumber} reprinted successfully.`);
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
          { text: 'Connect & Reprint', onPress: () => handleQuickReprint(item) },
        ]
      );
    } else {
      Alert.alert(
        'Receipt could not be sent to printer.',
        'Please check that printer is turned on and in range, then retry.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry Reprint', onPress: () => handleQuickReprint(item) },
        ]
      );
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const itemId = item._id || item.id;
    const isThisReprinting = reprintingId === itemId;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({ pathname: '/bill-details/[id]', params: { id: itemId } })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.billTitleRow}>
            <Text style={styles.billNumber}>{item.billNumber}</Text>
            {item.printCount > 0 && (
              <View style={styles.reprintBadge}>
                <Text style={styles.reprintBadgeText}>Printed {item.printCount}x</Text>
              </View>
            )}
          </View>
          <Text style={styles.orderType}>{item.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {formatDateTimeAscii(item.createdAt)}
          </Text>
          <View style={styles.rightActionRow}>
            <Text style={styles.amountText}>₹{formatMoney(item.grandTotalPaise)}</Text>
            <TouchableOpacity 
              style={styles.quickReprintBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleQuickReprint(item);
              }}
              disabled={isThisReprinting || isPrinting}
            >
              {isThisReprinting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons name="print" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bill History</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState icon="error-outline" title="Error" subtitle={error} />
          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState 
            icon="receipt" 
            title="No bills yet" 
            subtitle="Generated bills will appear here." 
          />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          data={orders}
          keyExtractor={item => item._id || item.id}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          onRefresh={loadOrders}
          refreshing={isLoading}
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  billNumber: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  orderType: {
    fontSize: typography.size.xs,
    color: colors.primary,
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    fontWeight: typography.weight.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  amountText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  billTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reprintBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  reprintBadgeText: {
    fontSize: typography.size.xs - 2,
    color: colors.accent,
    fontWeight: typography.weight.bold,
  },
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickReprintBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
  },
});
