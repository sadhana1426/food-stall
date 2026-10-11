import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { usePrinterStore } from '../../src/store/usePrinterStore';
import { useOrdersStore } from '../../src/store/useOrdersStore';
import { useMenuStore } from '../../src/store/useMenuStore';
import { useCartStore } from '../../src/store/useCartStore';
import { useAppStore } from '../../src/store/useAppStore';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../src/components/common/SecondaryButton';

export default function AppSettingsScreen() {
  const router = useRouter();
  
  const { defaultOrderType, setDefaultOrderType, resetSettings } = useSettingsStore();
  const { autoPrint, autoReconnect, updateConfig, forget } = usePrinterStore();
  const { resetOrders } = useOrdersStore();
  const { resetMenu } = useMenuStore();
  const { clearCart } = useCartStore();
  const { resetSetup } = useAppStore();

  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetData = () => {
    resetSettings();
    forget();
    resetOrders();
    resetMenu();
    clearCart();
    
    setShowResetModal(false);
    alert('Demo data has been reset to defaults.');
  };

  const handleRestartSetup = () => {
    handleResetData();
    resetSetup();
    router.replace('/setup');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <Text style={styles.label}>Default Order Type</Text>
          <SegmentedControl 
            options={[{ label: 'Dine In', value: 'Dine In' }, { label: 'Takeaway', value: 'Takeaway' }]} 
            selectedValue={defaultOrderType} 
            onSelect={(val) => setDefaultOrderType(val as any)} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Printer Settings</Text>
          
          <ToggleRow 
            title="Auto-Print Receipts" 
            subtitle="Print receipt immediately upon bill generation"
            value={autoPrint}
            onValueChange={(val) => updateConfig({ autoPrint: val })}
          />

          <ToggleRow 
            title="Auto-Reconnect" 
            subtitle="Automatically reconnect to paired printer on launch"
            value={autoReconnect}
            onValueChange={(val) => updateConfig({ autoReconnect: val })}
          />

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            
            <TouchableOpacity style={styles.dangerButton} onPress={() => setShowResetModal(true)}>
              <MaterialIcons name="delete-forever" size={24} color={colors.error} />
              <Text style={styles.dangerButtonText}>Reset Demo Data</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.dangerButton} onPress={handleRestartSetup}>
              <MaterialIcons name="refresh" size={24} color={colors.accent} />
              <Text style={[styles.dangerButtonText, { color: colors.accent }]}>Restart First-Time Setup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>Tasty Bites POS Prototype</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Reset Modal */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="warning" size={48} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Reset Demo Data?</Text>
            <Text style={styles.modalSubtitle}>
              This will clear all orders, reset the menu to defaults, and clear all settings. This action cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <SecondaryButton label="CANCEL" onPress={() => setShowResetModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  style={[styles.primaryBtnBase, { backgroundColor: colors.error }]} 
                  onPress={handleResetData}
                >
                  <Text style={styles.primaryBtnTextBase}>RESET ALL</Text>
                </TouchableOpacity>
              </View>
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
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dangerZone: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
    marginTop: spacing.md,
  },
  dangerTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.error,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dangerButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.error,
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  versionText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  primaryBtnBase: {
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnTextBase: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
});
