import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  Linking, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { usePrinterStore, isLikelyPrinterName, PRINTER_KEYWORDS } from '../../src/store/usePrinterStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { PrinterDevice, getPrinterKey } from '../../src/services/printer';

type PrinterUiState = 
  | 'permission-required'
  | 'permission-denied'
  | 'bluetooth-off'
  | 'no-printer'
  | 'paired'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'connection-lost'
  | 'error';

function getPrinterUiState(
  permissionState: string,
  bluetoothState: string,
  connectionState: string,
  selectedPrinter: PrinterDevice | null,
  bondedCount: number
): PrinterUiState {
  if (permissionState === 'undetermined' || connectionState === 'permission-required' || connectionState === 'PERMISSION_REQUIRED') {
    return 'permission-required';
  }
  if (permissionState === 'denied' || connectionState === 'permission-denied') {
    return 'permission-denied';
  }
  if (bluetoothState === 'OFF' || bluetoothState === 'UNSUPPORTED' || connectionState === 'bluetooth-off' || connectionState === 'BLUETOOTH_OFF') {
    return 'bluetooth-off';
  }
  if (connectionState === 'connecting' || connectionState === 'CONNECTING') {
    return 'connecting';
  }
  if (connectionState === 'disconnecting') {
    return 'disconnecting';
  }
  if (connectionState === 'connected' || connectionState === 'CONNECTED') {
    return 'connected';
  }
  if (connectionState === 'connection-lost') {
    return 'connection-lost';
  }
  if (connectionState === 'error' || connectionState === 'ERROR') {
    return 'error';
  }
  if (selectedPrinter || bondedCount > 0) {
    return 'paired';
  }
  return 'no-printer';
}

export default function PrinterSetupScreen() {
  const router = useRouter();
  const { business } = useSettingsStore();

  const { 
    initializePrinterSubsystem,
    reconcileBluetoothState,
    requestBluetoothPermission,
    openBluetoothSettings,
    refreshBondedDevices,
    selectPrinter,
    connectSelectedPrinter,
    disconnectSelectedPrinter,
    forgetSelectedPrinter,
    testPrint,
    scan,
    stopScan,
    updateConfig,
    clearPrinterError,
    // Store State
    permissionState,
    bluetoothState,
    connectionState,
    selectedPrinter,
    bondedDevices,
    nearbyDevices,
    paperWidth,
    autoPrint,
    autoReconnect,
    supportsCutter,
    isScanning,
    isPrinting,
    isConnecting,
    isReconciling,
    lastError,
  } = usePrinterStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllPaired, setShowAllPaired] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Initialize once on mount; AppState and events handle real-time synchronization
  useEffect(() => {
    initializePrinterSubsystem();
  }, []);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshBondedDevices();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleBack = () => {
    stopScan();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const handleConnect = async (device?: PrinterDevice) => {
    clearPrinterError();
    const success = await connectSelectedPrinter(device);
    if (!success) {
      const err = usePrinterStore.getState().lastError;
      if (err) {
        Alert.alert('Connection Failed', err);
      }
    }
  };

  const handleTestPrint = async () => {
    clearPrinterError();
    const success = await testPrint(business.name || 'Tasty Bites');
    if (success) {
      Alert.alert('Test Print Sent', 'ESC/POS test receipt has been sent to your thermal printer.');
    } else {
      const err = usePrinterStore.getState().lastError || 'Unable to print test receipt. Check printer power & connection.';
      Alert.alert('Print Failed', err);
    }
  };

  const uiState = getPrinterUiState(
    permissionState,
    bluetoothState,
    connectionState,
    selectedPrinter,
    bondedDevices.length
  );

  const isBtOn = bluetoothState === 'ON';
  const isBtOff = bluetoothState === 'OFF';

  // Split bonded devices into likely printers and other paired items
  const likelyPrinters = bondedDevices.filter(d => isLikelyPrinterName(d.name));
  const otherPairedDevices = bondedDevices.filter(d => !isLikelyPrinterName(d.name));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Setup</Text>
        
        {/* Bluetooth Live Status Badge */}
        <View style={styles.headerRight}>
          {isBtOn ? (
            <View style={styles.headerActionsRow}>
              <View style={styles.btLiveBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.btLiveText}>Bluetooth ON</Text>
              </View>
              <TouchableOpacity 
                style={styles.headerRefreshBtn} 
                onPress={handleManualRefresh}
                disabled={isRefreshing || isReconciling}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isRefreshing || isReconciling ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="refresh" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ) : isBtOff ? (
            <View style={styles.btOffBadge}>
              <View style={styles.redDot} />
              <Text style={styles.btOffText}>Bluetooth OFF</Text>
            </View>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleManualRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
      >
        
        {/* ================================================================= */}
        {/* UI STATE: 1. PERMISSION REQUIRED                                   */}
        {/* ================================================================= */}
        {uiState === 'permission-required' && (
          <View style={styles.stateCard}>
            <View style={styles.stateIconCircle}>
              <MaterialIcons name="print" size={38} color={colors.primary} />
            </View>
            <Text style={styles.cardHeading}>Connect your receipt printer</Text>
            <Text style={styles.cardSubtext}>
              Tasty Bites needs Nearby Devices permission to connect to your Bluetooth thermal printer.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%', gap: spacing.sm }}>
              <PrimaryButton 
                label="Allow Bluetooth Access" 
                onPress={requestBluetoothPermission} 
              />
              <TouchableOpacity 
                style={styles.outlineActionBtn} 
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.outlineActionText}>Open App Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 2. PERMISSION DENIED                                     */}
        {/* ================================================================= */}
        {uiState === 'permission-denied' && (
          <View style={styles.stateCardWarning}>
            <View style={styles.stateIconCircleWarning}>
              <MaterialIcons name="security" size={38} color={colors.error} />
            </View>
            <Text style={styles.cardHeading}>Bluetooth access is required</Text>
            <Text style={styles.cardSubtext}>
              Bluetooth permission was denied. Tasty Bites requires Nearby Devices permission to communicate with your printer.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%', gap: spacing.sm }}>
              <PrimaryButton 
                label="Try Again" 
                onPress={requestBluetoothPermission} 
              />
              <TouchableOpacity 
                style={styles.outlineActionBtn} 
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.outlineActionText}>Open App Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 3. BLUETOOTH OFF                                        */}
        {/* ================================================================= */}
        {uiState === 'bluetooth-off' && (
          <View style={styles.btOffCard}>
            <View style={styles.btOffIconCircle}>
              <MaterialIcons name="bluetooth-disabled" size={40} color={colors.error} />
            </View>
            <Text style={styles.cardHeading}>Bluetooth is Off</Text>
            <Text style={styles.cardSubtext}>
              Turn on Bluetooth to connect your receipt printer.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%', gap: spacing.sm }}>
              <PrimaryButton 
                label="Open Bluetooth Settings" 
                onPress={openBluetoothSettings} 
              />
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 4. NO PRINTER PAIRED                                    */}
        {/* ================================================================= */}
        {uiState === 'no-printer' && (
          <View style={styles.stateCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="bluetooth-searching" size={36} color={colors.text.secondary} />
            </View>
            <Text style={styles.cardHeading}>No receipt printer paired</Text>
            <Text style={styles.cardSubtext}>
              Pair your Bluetooth thermal printer in your phone's Bluetooth settings, then return to Tasty Bites.
            </Text>
            <Text style={styles.helperTip}>
              Tip: Some thermal printers may ask for a PIN (usually 0000 or 1234). Check your printer manual.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%', gap: spacing.sm }}>
              <PrimaryButton 
                label="Open Bluetooth Settings" 
                onPress={openBluetoothSettings} 
              />
              <TouchableOpacity 
                style={styles.outlineActionBtn} 
                onPress={handleManualRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.outlineActionText}>Already paired? Refresh</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 5. CONNECTING                                           */}
        {/* ================================================================= */}
        {uiState === 'connecting' && selectedPrinter && (
          <View style={styles.stateCard}>
            <View style={styles.printerIconCircle}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.cardHeading, { marginTop: spacing.md }]}>{selectedPrinter.name}</Text>
            <Text style={styles.cardSubtext}>Connecting to printer...</Text>
            <Text style={styles.addressMuted}>{selectedPrinter.address}</Text>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 6. CONNECTED & READY                                    */}
        {/* ================================================================= */}
        {uiState === 'connected' && selectedPrinter && (
          <View style={styles.section}>
            <View style={styles.connectedCard}>
              <View style={styles.connectedTopRow}>
                <View style={styles.printerIconCircleActive}>
                  <MaterialIcons name="print" size={28} color={colors.white} />
                </View>
                <View style={styles.connectedInfo}>
                  <Text style={styles.printerName}>{selectedPrinter.name}</Text>
                  <Text style={styles.printerAddress}>{selectedPrinter.address}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.statusConnected}>Connected • Ready</Text>
                  </View>
                </View>
                <View style={styles.widthBadge}>
                  <Text style={styles.widthBadgeText}>{paperWidth}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.connectedActions}>
                <PrimaryButton 
                  label={isPrinting ? "PRINTING TEST..." : "TEST PRINT"} 
                  onPress={handleTestPrint} 
                  disabled={isPrinting}
                />
                
                <View style={styles.secondaryActionRow}>
                  <TouchableOpacity 
                    style={styles.textActionBtn} 
                    onPress={disconnectSelectedPrinter}
                  >
                    <MaterialIcons name="link-off" size={16} color={colors.error} />
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                  <Text style={styles.actionDivider}>•</Text>
                  <TouchableOpacity 
                    style={styles.textActionBtn} 
                    onPress={forgetSelectedPrinter}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.forgetBtnText}>Forget in Tasty Bites</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Hardware & Receipt Preferences */}
            <View style={styles.configCard}>
              <Text style={styles.configHeading}>Printer Preferences</Text>
              
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Paper Width</Text>
                <SegmentedControl 
                  options={[{ label: '50mm / 58mm (32 col)', value: '58mm' }, { label: '80mm (48 col)', value: '80mm' }]} 
                  selectedValue={paperWidth === '50mm' ? '58mm' : paperWidth} 
                  onSelect={(val: any) => updateConfig({ paperWidth: val })} 
                />
              </View>

              <ToggleRow
                title="Auto Reconnect"
                subtitle="Automatically reconnect to this printer when app resumes"
                value={autoReconnect}
                onValueChange={(val) => updateConfig({ autoReconnect: val })}
              />

              <ToggleRow
                title="Auto Print After Bill"
                subtitle="Instantly print thermal receipt when order is saved"
                value={autoPrint}
                onValueChange={(val) => updateConfig({ autoPrint: val })}
              />

              <ToggleRow
                title="Auto Cutter"
                subtitle="Send hardware cut command after printing bill"
                value={supportsCutter}
                onValueChange={(val) => updateConfig({ supportsCutter: val })}
              />
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 7. PAIRED WITH PHONE (DISCONNECTED SOCKET)              */}
        {/* ================================================================= */}
        {uiState === 'paired' && selectedPrinter && (
          <View style={styles.pairedCard}>
            <View style={styles.pairedTopRow}>
              <View style={styles.printerIconCircle}>
                <MaterialIcons name="print" size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.printerName}>{selectedPrinter.name}</Text>
                <View style={styles.statusRow}>
                  <MaterialIcons name="check-circle" size={14} color="#059669" />
                  <Text style={styles.statusPaired}>Paired with phone</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => handleConnect(selectedPrinter)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.connectButtonText}>Connect Printer</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.pairedFooterRow}>
              <TouchableOpacity 
                style={styles.textActionBtnSmall}
                onPress={forgetSelectedPrinter}
              >
                <Text style={styles.forgetSmallText}>Forget in Tasty Bites</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.textActionBtnSmall}
                onPress={openBluetoothSettings}
              >
                <Text style={styles.settingsSmallText}>Phone Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* UI STATE: 8. CONNECTION LOST                                      */}
        {/* ================================================================= */}
        {uiState === 'connection-lost' && selectedPrinter && (
          <View style={styles.stateCardWarning}>
            <View style={styles.stateIconCircleWarning}>
              <MaterialIcons name="signal-wifi-statusbar-connected-no-internet-4" size={36} color={colors.error} />
            </View>
            <Text style={styles.cardHeading}>Printer connection lost</Text>
            <Text style={styles.cardSubtext}>
              {selectedPrinter.name} is still paired with your phone, but the RFCOMM connection was lost.
            </Text>
            <View style={{ marginTop: spacing.md, width: '100%', gap: spacing.sm }}>
              <PrimaryButton 
                label="Reconnect" 
                onPress={() => handleConnect(selectedPrinter)} 
                disabled={isConnecting}
              />
              <TouchableOpacity 
                style={styles.outlineActionBtn} 
                onPress={openBluetoothSettings}
              >
                <Text style={styles.outlineActionText}>Open Bluetooth Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Friendly Bluetooth Sync Tip */}
        {isBtOn && uiState !== 'permission-required' && uiState !== 'permission-denied' && (
          <View style={styles.syncTipBanner}>
            <View style={styles.syncTipIconCircle}>
              <MaterialIcons name="bluetooth-searching" size={20} color={colors.primary} />
            </View>
            <View style={styles.syncTipTextContainer}>
              <Text style={styles.syncTipTitle}>Bluetooth Connection Check</Text>
              <Text style={styles.syncTipBody}>
                Please check once if your Bluetooth is connected. You can also pair or manage devices directly in phone settings.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.syncTipSettingsBtn}
              onPress={openBluetoothSettings}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="settings" size={13} color={colors.primary} />
              <Text style={styles.syncTipSettingsText}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================= */}
        {/* BONDED DEVICES LIST (When Bluetooth is ON)                        */}
        {/* ================================================================= */}
        {isBtOn && bondedDevices.length > 0 && (
          <View style={styles.section}>
            {/* Section A: Likely Receipt Printers */}
            <View style={styles.deviceSectionHeader}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.sectionTitle}>Receipt Printers</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{likelyPrinters.length}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.refreshPillButton} 
                onPress={handleManualRefresh}
                disabled={isRefreshing || isReconciling}
              >
                <MaterialIcons name="refresh" size={15} color={colors.primary} />
                <Text style={styles.refreshPillText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {likelyPrinters.length > 0 ? (
              <View style={styles.deviceList}>
                {likelyPrinters.map((device) => {
                  const isSelected = getPrinterKey(selectedPrinter) === getPrinterKey(device);
                  const isSocketConn = isSelected && uiState === 'connected';

                  return (
                    <View 
                      key={device.id} 
                      style={[
                        styles.deviceRow, 
                        isSocketConn && styles.deviceRowConnected
                      ]}
                    >
                      <View style={[
                        styles.deviceIconCircle,
                        styles.deviceIconCirclePrinter,
                        isSocketConn && styles.deviceIconCircleActive
                      ]}>
                        <MaterialIcons 
                          name="print" 
                          size={22} 
                          color={isSocketConn ? colors.white : colors.primary} 
                        />
                      </View>

                      <View style={styles.deviceInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text>
                          <View style={styles.printerTag}>
                            <Text style={styles.printerTagText}>THERMAL</Text>
                          </View>
                        </View>
                        <Text style={styles.deviceSub}>{device.address}</Text>
                      </View>

                      {isSocketConn ? (
                        <View style={styles.connectedBadge}>
                          <MaterialIcons name="check" size={14} color="#059669" />
                          <Text style={styles.connectedBadgeText}>Connected</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.connectButtonSmall}
                          onPress={() => handleConnect(device)}
                          disabled={isConnecting}
                        >
                          <Text style={styles.connectButtonTextSmall}>Connect</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPrintersNotice}>
                <Text style={styles.emptyPrintersText}>
                  No thermal printers detected in paired devices.
                </Text>
              </View>
            )}

            {/* Section B: Other Paired Bluetooth Devices (Speakers, Buds, etc.) */}
            {otherPairedDevices.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <TouchableOpacity 
                  style={styles.otherDevicesToggle}
                  onPress={() => setShowAllPaired(!showAllPaired)}
                >
                  <Text style={styles.otherDevicesTitle}>
                    Other paired devices ({otherPairedDevices.length})
                  </Text>
                  <MaterialIcons 
                    name={showAllPaired ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={20} 
                    color={colors.text.secondary} 
                  />
                </TouchableOpacity>

                {showAllPaired && (
                  <View style={[styles.deviceList, { marginTop: spacing.xs }]}>
                    {otherPairedDevices.map((device) => {
                      const isSelected = getPrinterKey(selectedPrinter) === getPrinterKey(device);
                      const isSocketConn = isSelected && uiState === 'connected';

                      return (
                        <View key={device.id} style={styles.deviceRow}>
                          <View style={styles.deviceIconCircle}>
                            <MaterialIcons name="bluetooth" size={20} color={colors.text.secondary} />
                          </View>
                          <View style={styles.deviceInfo}>
                            <Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text>
                            <Text style={styles.deviceSub}>{device.address}</Text>
                          </View>
                          {isSocketConn ? (
                            <View style={styles.connectedBadge}>
                              <MaterialIcons name="check" size={14} color="#059669" />
                              <Text style={styles.connectedBadgeText}>Active</Text>
                            </View>
                          ) : (
                            <TouchableOpacity 
                              style={styles.connectButtonSmall}
                              onPress={() => handleConnect(device)}
                              disabled={isConnecting}
                            >
                              <Text style={styles.connectButtonTextSmall}>Connect</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Action to pair new in Android Bluetooth settings */}
            <TouchableOpacity 
              style={styles.pairNewRow}
              onPress={openBluetoothSettings}
            >
              <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.pairNewText}>Pair a new printer in Phone Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================= */}
        {/* ADVANCED SCAN FALLBACK (User triggered)                           */}
        {/* ================================================================= */}
        {isBtOn && (
          <View style={styles.discoverySection}>
            <Text style={styles.advancedTitle}>Can't find your printer?</Text>
            {isScanning ? (
              <View style={styles.scanningBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.scanningText}>Searching for nearby Bluetooth devices...</Text>
                <TouchableOpacity onPress={stopScan} style={styles.stopScanBtn}>
                  <Text style={styles.stopScanText}>Stop</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.scanNearbyBtn} onPress={scan}>
                <MaterialIcons name="search" size={20} color={colors.primary} />
                <Text style={styles.scanNearbyText}>Search Nearby Devices</Text>
              </TouchableOpacity>
            )}

            {nearbyDevices.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.subhead}>NEARBY DEVICES DISCOVERED</Text>
                {nearbyDevices.map((device) => (
                  <View key={device.id} style={styles.deviceRow}>
                    <View style={styles.deviceIconCircle}>
                      <MaterialIcons name="bluetooth-searching" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceSub}>{device.address}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.connectButtonSmall}
                      onPress={() => handleConnect(device)}
                      disabled={isConnecting}
                    >
                      <Text style={styles.connectButtonTextSmall}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* DEVELOPMENT DIAGNOSTICS PANEL (__DEV__ ONLY)                      */}
        {/* ================================================================= */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <TouchableOpacity 
              style={styles.devHeader}
              onPress={() => setShowDiagnostics(!showDiagnostics)}
            >
              <MaterialIcons name="developer-mode" size={16} color={colors.text.secondary} />
              <Text style={styles.devTitle}>Development Diagnostics</Text>
              <MaterialIcons 
                name={showDiagnostics ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={18} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>

            {showDiagnostics && (
              <View style={styles.devCard}>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Permission:</Text>
                  <Text style={styles.devVal}>{permissionState.toUpperCase()}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Bluetooth Adapter:</Text>
                  <Text style={styles.devVal}>{bluetoothState}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Selected Printer:</Text>
                  <Text style={styles.devVal}>{selectedPrinter?.name || 'NONE'} ({selectedPrinter?.address || 'N/A'})</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Android Bonded Count:</Text>
                  <Text style={styles.devVal}>{bondedDevices.length}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Store Connection State:</Text>
                  <Text style={styles.devVal}>{connectionState}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>UI Selector Phase:</Text>
                  <Text style={styles.devVal}>{uiState}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Auto Reconnect:</Text>
                  <Text style={styles.devVal}>{autoReconnect ? 'ON' : 'OFF'}</Text>
                </View>
                <View style={styles.devRow}>
                  <Text style={styles.devKey}>Is Reconciling:</Text>
                  <Text style={styles.devVal}>{isReconciling ? 'YES' : 'NO'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { 
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  btLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  btLiveText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#059669',
  },
  btOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
    marginRight: 5,
  },
  btOffText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.error,
  },
  content: {
    padding: spacing.lg,
  },
  stateCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  stateCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  btOffCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  stateIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stateIconCircleWarning: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  btOffIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardHeading: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardSubtext: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  helperTip: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  addressMuted: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
  outlineActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  outlineActionText: {
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: colors.primary + '14',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginLeft: spacing.xs,
  },
  countBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  deviceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRefreshBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  refreshPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '14',
    borderWidth: 1,
    borderColor: colors.primary + '28',
  },
  refreshPillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginLeft: 4,
  },
  connectedCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#10B981',
    ...shadows.medium,
  },
  pairedCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    ...shadows.small,
  },
  connectedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  printerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerIconCircleActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  printerName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  printerAddress: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusConnected: {
    fontSize: typography.size.sm,
    color: '#059669',
    fontWeight: typography.weight.bold,
  },
  statusPaired: {
    fontSize: typography.size.xs,
    color: '#059669',
    fontWeight: typography.weight.medium,
    marginLeft: 4,
  },
  widthBadge: {
    backgroundColor: colors.primary + '14',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  widthBadgeText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  connectedActions: {
    marginTop: spacing.xs,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  textActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textActionBtnSmall: {
    paddingVertical: 4,
  },
  forgetSmallText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  settingsSmallText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  actionDivider: {
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  disconnectText: {
    color: colors.error,
    fontWeight: typography.weight.medium,
    fontSize: typography.size.sm,
    marginLeft: 4,
  },
  forgetBtnText: {
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
    fontSize: typography.size.sm,
    marginLeft: 4,
  },
  configCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  configHeading: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  configItem: {
    marginBottom: spacing.md,
  },
  configLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  deviceList: {
    gap: spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  deviceRowConnected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  deviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconCirclePrinter: {
    backgroundColor: colors.primary + '14',
  },
  deviceIconCircleActive: {
    backgroundColor: '#10B981',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  printerTag: {
    backgroundColor: colors.primary + '14',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
    marginLeft: 6,
  },
  printerTagText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  deviceSub: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  connectButtonSmall: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonTextSmall: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  connectedBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#059669',
    marginLeft: 3,
  },
  pairNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  pairNewText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
    fontSize: typography.size.sm,
  },
  emptyPrintersNotice: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyPrintersText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  otherDevicesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  otherDevicesTitle: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  discoverySection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  advancedTitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xs,
  },
  scanNearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanNearbyText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
    fontSize: typography.size.sm,
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanningText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  stopScanBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
  },
  stopScanText: {
    color: colors.error,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  syncTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  syncTipIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  syncTipTextContainer: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  syncTipTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#065F46',
    marginBottom: 2,
  },
  syncTipBody: {
    fontSize: typography.size.xs,
    color: '#047857',
    lineHeight: 18,
  },
  syncTipSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  syncTipSettingsText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  subhead: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  devSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  devTitle: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
    marginLeft: 6,
  },
  devCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: 4,
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  devKey: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  devVal: {
    fontSize: typography.size.xs,
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
  },
});
