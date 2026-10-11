import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatMoney } from '../../src/utils/money';
import { salesApi } from '../../src/api/salesApi';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { reportsApi } from '../../src/api/reportsApi';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SalesScreen() {
  const [salesData, setSalesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadRange = async (format: 'pdf' | 'csv') => {
    setIsDownloading(true);
    try {
      const fromStr = dateFrom.toISOString().split('T')[0];
      const toStr = dateTo.toISOString().split('T')[0];
      
      const uri = format === 'pdf' 
        ? await reportsApi.downloadSalesPdf(fromStr, toStr)
        : await reportsApi.downloadSalesCsv(fromStr, toStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert(`Downloaded to ${uri}`);
      }
      setIsModalVisible(false);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await salesApi.getTodaySales();
      setSalesData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load sales.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  if (isLoading && !salesData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
          <Text style={styles.title}>Sales Dashboard</Text>
         </View>
         <View style={styles.centerContainer}>
           <ActivityIndicator size="large" color={colors.primary} />
         </View>
      </SafeAreaView>
    );
  }

  if (error && !salesData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
         <View style={styles.header}>
          <Text style={styles.title}>Sales Dashboard</Text>
         </View>
         <View style={styles.centerContainer}>
           <EmptyState icon="error-outline" title="Error" subtitle={error} />
           <TouchableOpacity style={styles.retryButton} onPress={loadSales}>
             <Text style={styles.retryText}>Retry</Text>
           </TouchableOpacity>
         </View>
      </SafeAreaView>
    );
  }

  const { totalSalesPaise, totalBills, dineInSalesPaise, takeawaySalesPaise, topItems } = salesData || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Dashboard</Text>
        <TouchableOpacity style={styles.downloadIconBtn} onPress={() => setIsModalVisible(true)}>
          <MaterialIcons name="file-download" size={24} color={colors.primary} />
          <Text style={styles.downloadIconText}>Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>₹{formatMoney(totalSalesPaise || 0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Bills</Text>
            <Text style={styles.summaryValue}>{totalBills || 0}</Text>
          </View>
        </View>

        {!totalBills || totalBills === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState 
              icon="bar-chart" 
              title="No sales data" 
              subtitle="Sales data will appear after bills are generated." 
            />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Breakdown</Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Dine In</Text>
                  <Text style={styles.breakdownValue}>₹{formatMoney(dineInSalesPaise || 0)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Takeaway</Text>
                  <Text style={styles.breakdownValue}>₹{formatMoney(takeawaySalesPaise || 0)}</Text>
                </View>
              </View>
            </View>

            {topItems && topItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Selling Items</Text>
                <View style={styles.topItemsCard}>
                  {topItems.map((item: any, idx: number) => (
                    <View key={idx} style={styles.topItemRow}>
                      <Text style={styles.topItemName}>{item.itemName}</Text>
                      <View style={styles.topItemRight}>
                        <Text style={styles.topItemQty}>{item.quantity} sold</Text>
                        <Text style={styles.topItemTotal}>₹{formatMoney(item.salesPaise)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <Text style={styles.modalTitle}>Download Report</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><MaterialIcons name="close" size={24} color={colors.text.secondary}/></TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSubtitle}>Today's Sales</Text>
              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setDateFrom(new Date()); setDateTo(new Date()); handleDownloadRange('pdf'); }} disabled={isDownloading}>
                  <MaterialIcons name="picture-as-pdf" size={20} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setDateFrom(new Date()); setDateTo(new Date()); handleDownloadRange('csv'); }} disabled={isDownloading}>
                  <MaterialIcons name="table-chart" size={20} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSubtitle}>Custom Date Range</Text>
              
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>{dateFrom.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <MaterialIcons name="arrow-forward" size={16} color={colors.text.secondary} style={styles.dateArrow} />
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowToPicker(true)}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>{dateTo.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadRange('pdf')} disabled={isDownloading}>
                  <MaterialIcons name="picture-as-pdf" size={20} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadRange('csv')} disabled={isDownloading}>
                  <MaterialIcons name="table-chart" size={20} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {showFromPicker && (
          <DateTimePicker
            value={dateFrom}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event: any, date?: Date) => {
              setShowFromPicker(Platform.OS === 'ios');
              if (date) {
                setDateFrom(date);
                if (date > dateTo) setDateTo(date);
              }
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={dateTo}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event: any, date?: Date) => {
              setShowToPicker(Platform.OS === 'ios');
              if (date) {
                if (date < dateFrom) alert("To Date cannot be before From Date");
                else setDateTo(date);
              }
            }}
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  downloadIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  downloadIconText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.xl,
  },
  modalSubtitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    marginLeft: spacing.xs,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateBox: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  dateArrow: {
    marginHorizontal: spacing.sm,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.md,
    ...shadows.medium,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  emptyContainer: {
    paddingTop: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  breakdownLabel: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  breakdownValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  topItemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  topItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topItemName: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
  },
  topItemRight: {
    alignItems: 'flex-end',
  },
  topItemQty: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  topItemTotal: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  }
});
