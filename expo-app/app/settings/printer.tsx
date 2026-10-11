import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { usePrinterStore } from '../../src/store/usePrinterStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { SecondaryButton } from '../../src/components/common/SecondaryButton';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';

export default function PrinterSetupScreen() {
  const router = useRouter();
  const { business } = useSettingsStore();
  const { 
    init, bluetoothState, connectionState,
    selectedPrinter, pairedDevices, nearbyDevices,
    isScanning, isPrinting, lastError,
    paperWidth, autoPrint, autoReconnect, supportsCutter,
    requestPermissions, refreshPairedDevices, scan, stopScan,
    selectPrinter, connect, disconnect, forget, testPrint, updateConfig
  } = usePrinterStore();

  useEffect(() => {
    init();
    refreshPairedDevices();
    return () => {
      stopScan();
    };
  }, []);

  const handleBack = () => {
    stopScan();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const handleTestPrint = async () => {
    const success = await testPrint(business.name);
    if (success) {
      Alert.alert('Success', 'Test receipt sent to printer.');
    } else {
      Alert.alert('Print Failed', lastError || 'Unable to print.');
    }
  };

  const handleConnect = async (device: any) => {
    if (isScanning) await stopScan();
    await selectPrinter(device);
    const success = await connect();
    if (!success) {
      Alert.alert('Connection Failed', usePrinterStore.getState().lastError || 'Unable to connect to this printer.');
    }
  };

  const renderDevice = (device: any, isConnected: boolean) => (
    <TouchableOpacity 
      key={device.id} 
      style={styles.deviceRow}
      onPress={() => !isConnected && handleConnect(device)}
      disabled={connectionState === 'CONNECTING' || connectionState === 'PAIRING'}
    >
      <View style={styles.deviceInfo}>
        <MaterialIcons 
          name="print" 
          size={24} 
          color={isConnected ? colors.primary : colors.text.secondary} 
        />
        <View style={styles.deviceText}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceMeta}>
            {device.bonded ? 'Paired' : 'Nearby'} • {device.transport}
          </Text>
        </View>
      </View>
      {isConnected ? (
        <MaterialIcons name="check-circle" size={24} color={colors.primary} />
      ) : (
        <Text style={styles.connectText}>Connect</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* State Banners */}
        {bluetoothState === 'OFF' && (
          <View style={styles.warningBox}>
            <MaterialIcons name="bluetooth-disabled" size={24} color={colors.error} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={styles.warningTitle}>Bluetooth is off</Text>
              <Text style={styles.warningText}>Turn on Bluetooth in your device settings to connect your printer.</Text>
            </View>
          </View>
        )}

        {connectionState === 'PERMISSION_REQUIRED' && (
          <View style={styles.warningBox}>
            <MaterialIcons name="security" size={24} color={colors.accent} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={styles.warningTitle}>Permission Required</Text>
              <Text style={styles.warningText}>Tasty Bites needs Nearby Devices permission to find and connect to your thermal printer.</Text>
              <TouchableOpacity style={{ marginTop: spacing.sm }} onPress={requestPermissions}>
                <Text style={{ color: colors.accent, fontWeight: 'bold' }}>GRANT PERMISSION</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selected Printer Card */}
        {selectedPrinter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Printer</Text>
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.deviceInfo}>
                  <MaterialIcons name="print" size={32} color={colors.primary} />
                  <View style={styles.deviceText}>
                    <Text style={styles.activeName}>{selectedPrinter.name}</Text>
                    
                    {connectionState === 'CONNECTING' ? (
                      <Text style={styles.statusConnecting}>Connecting...</Text>
                    ) : connectionState === 'PAIRING' ? (
                      <Text style={styles.statusConnecting}>Pairing...</Text>
                    ) : connectionState === 'CONNECTED' ? (
                      <Text style={styles.statusConnected}>Connected • Ready</Text>
                    ) : (
                      <Text style={styles.statusDisconnected}>Disconnected</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.configGrid}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Paper Width</Text>
                  <SegmentedControl 
                    options={[{ label: '58mm', value: '58mm' }, { label: '80mm', value: '80mm' }]} 
                    selectedValue={paperWidth} 
                    onSelect={(val: any) => updateConfig({ paperWidth: val })} 
                  />
                </View>
              </View>

              <ToggleRow
                title="Auto Reconnect"
                subtitle="Connect automatically on launch"
                value={autoReconnect}
                onValueChange={(val) => updateConfig({ autoReconnect: val })}
              />
              
              <ToggleRow
                title="Auto Print After Bill"
                subtitle="Print immediately when bill is created"
                value={autoPrint}
                onValueChange={(val) => updateConfig({ autoPrint: val })}
              />

              <ToggleRow
                title="Has Cutter (Advanced)"
                subtitle="Enable automatic paper cut"
                value={supportsCutter}
                onValueChange={(val) => updateConfig({ supportsCutter: val })}
              />

              <View style={styles.cardActions}>
                {connectionState === 'CONNECTED' ? (
                  <>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <SecondaryButton 
                        label={isPrinting ? "PRINTING..." : "TEST PRINT"} 
                        onPress={handleTestPrint} 
                        disabled={isPrinting}
                      />
                    </View>
                    <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
                      <Text style={styles.disconnectBtnText}>DISCONNECT</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={{ flex: 1 }}>
                    <PrimaryButton 
                      label={connectionState === 'CONNECTING' || connectionState === 'PAIRING' ? "CONNECTING..." : "CONNECT"}
                      onPress={connect}
                      disabled={connectionState === 'CONNECTING' || connectionState === 'PAIRING' || bluetoothState === 'OFF'}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.forgetBtn} onPress={forget}>
                <Text style={styles.forgetBtnText}>Forget Printer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Discovery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover</Text>
            {isScanning ? (
              <TouchableOpacity onPress={stopScan}>
                <Text style={styles.cancelText}>Stop Scan</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={scan} disabled={bluetoothState === 'OFF'}>
                <Text style={styles.scanText}>Scan for Printers</Text>
              </TouchableOpacity>
            )}
          </View>

          {isScanning && (
            <View style={styles.scanningState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.scanningText}>Searching for nearby printers...</Text>
            </View>
          )}

          {pairedDevices.length > 0 && (
            <View style={styles.deviceList}>
              <Text style={styles.listSubhead}>PAIRED DEVICES</Text>
              {pairedDevices.map(d => renderDevice(d, selectedPrinter?.id === d.id))}
            </View>
          )}

          {nearbyDevices.length > 0 && (
            <View style={styles.deviceList}>
              <Text style={styles.listSubhead}>NEARBY DEVICES</Text>
              {nearbyDevices.map(d => renderDevice(d, false))}
            </View>
          )}
        </View>

      </ScrollView>
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  warningTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  warningText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
  },
  scanText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  cancelText: {
    color: colors.error,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  activeHeader: {
    marginBottom: spacing.md,
  },
  activeName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusConnected: {
    fontSize: typography.size.sm,
    color: colors.success,
    fontWeight: typography.weight.bold,
  },
  statusConnecting: {
    fontSize: typography.size.sm,
    color: colors.accent,
    fontWeight: typography.weight.bold,
  },
  statusDisconnected: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  configGrid: {
    marginBottom: spacing.md,
  },
  configItem: {
    marginBottom: spacing.sm,
  },
  configLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    alignItems: 'center',
  },
  disconnectBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  disconnectBtnText: {
    color: colors.error,
    fontWeight: typography.weight.bold,
  },
  forgetBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  forgetBtnText: {
    color: colors.error,
    fontSize: typography.size.sm,
    textDecorationLine: 'underline',
  },
  scanningState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  scanningText: {
    marginLeft: spacing.sm,
    color: colors.text.secondary,
  },
  deviceList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  listSubhead: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#F9FAFB',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  deviceName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  deviceMeta: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  connectText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
