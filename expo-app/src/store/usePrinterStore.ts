import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { 
  printerService, 
  PrinterDevice, 
  PrinterConnectionState, 
  PaperWidth, 
  PrinterCapabilities,
  PermissionState,
  BluetoothAdapterState,
  getPrinterKey,
  getUserFriendlyPrinterError
} from '../services/printer';
import { ordersApi } from '../api/ordersApi';

const PRINTER_STORE_KEY = 'tasty_bites_printer_config';
const LOG_TAG = '[Printer]';

export const PRINTER_KEYWORDS = ['pos', 'printer', 'thermal', 'esc', 'xp', 'rp', 'rpp', 'pt', '58', '80', 'mtp', 'innerprinter', 'bluetooth printer'];

export function isLikelyPrinterName(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return PRINTER_KEYWORDS.some(k => lower.includes(k));
}

interface PrinterConfig {
  selectedPrinter: PrinterDevice | null;
  paperWidth: PaperWidth;
  autoPrint: boolean;
  autoReconnect: boolean;
  supportsCutter: boolean;
}

export interface PrinterStoreState extends PrinterConfig {
  permissionState: PermissionState;
  bluetoothState: BluetoothAdapterState;
  connectionState: PrinterConnectionState;
  lastError: string | null;
  lastReconcileAt: number | null;
  isReconciling: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isScanning: boolean;
  isPrinting: boolean;

  bondedDevices: PrinterDevice[];
  pairedDevices: PrinterDevice[];
  nearbyDevices: PrinterDevice[];

  userDisconnectedAddress: string | null;

  // Master Actions
  initializePrinterSubsystem: () => Promise<void>;
  requestBluetoothPermission: () => Promise<boolean>;
  openBluetoothSettings: () => Promise<void>;
  reconcileBluetoothState: (trigger?: string) => Promise<void>;
  refreshBondedDevices: () => Promise<PrinterDevice[]>;
  selectPrinter: (device: PrinterDevice | null) => Promise<void>;
  connectSelectedPrinter: (targetDevice?: PrinterDevice) => Promise<boolean>;
  disconnectSelectedPrinter: () => Promise<void>;
  forgetSelectedPrinter: () => Promise<void>;
  testPrint: (businessName?: string) => Promise<boolean>;
  ensureConnectedForPrint: () => Promise<boolean>;
  printOrder: (order: any) => Promise<boolean>;
  reprintOrder: (order: any) => Promise<{ success: boolean; status: 'SUCCESS' | 'NO_PRINTER' | 'DISCONNECTED' | 'FAILED'; error?: string; updatedOrder?: any }>;
  handleConnectionLost: () => void;
  clearPrinterError: () => void;

  scan: () => Promise<void>;
  stopScan: () => Promise<void>;
  updateConfig: (config: Partial<PrinterConfig>) => Promise<void>;

  // Backwards compatible aliases
  init: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  requestEnableBluetooth: () => Promise<boolean>;
  checkBluetoothState: () => Promise<BluetoothAdapterState>;
  checkConnection: () => Promise<boolean>;
  refreshPairedDevices: () => Promise<void>;
  connect: () => Promise<boolean>;
  connectDevice: (device: PrinterDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  forget: () => Promise<void>;
}

const DEFAULT_CONFIG: PrinterConfig = {
  selectedPrinter: null,
  paperWidth: '58mm',
  autoPrint: false,
  autoReconnect: true,
  supportsCutter: false,
};

// Module-level singletons to eliminate race conditions
let isSubsystemInitialized = false;
let appStateSubscription: { remove: () => void } | null = null;
let debounceReconcileTimer: any = null;
let connectionLockPromise: Promise<boolean> | null = null;
let writeLockPromise: Promise<boolean> | null = null;

export const usePrinterStore = create<PrinterStoreState>((set, get) => ({
  ...DEFAULT_CONFIG,

  permissionState: 'undetermined',
  bluetoothState: 'UNKNOWN',
  connectionState: 'idle',
  lastError: null,
  lastReconcileAt: null,
  isReconciling: false,
  isConnecting: false,
  isDisconnecting: false,
  isScanning: false,
  isPrinting: false,

  bondedDevices: [],
  pairedDevices: [],
  nearbyDevices: [],

  userDisconnectedAddress: null,

  initializePrinterSubsystem: async () => {
    if (isSubsystemInitialized) {
      console.log(`${LOG_TAG} subsystem already initialized, reconciling...`);
      await get().reconcileBluetoothState('re-init');
      return;
    }
    isSubsystemInitialized = true;
    console.log(`${LOG_TAG} initializing printer subsystem...`);

    try {
      // 1. Restore stored configuration safely (never restore connected: true)
      const stored = await SecureStore.getItemAsync(PRINTER_STORE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const safePrinter = parsed.selectedPrinter 
            ? { ...parsed.selectedPrinter, connected: false } 
            : null;
          set({
            selectedPrinter: safePrinter,
            paperWidth: parsed.paperWidth || '58mm',
            autoPrint: Boolean(parsed.autoPrint),
            autoReconnect: parsed.autoReconnect !== undefined ? Boolean(parsed.autoReconnect) : true,
            supportsCutter: Boolean(parsed.supportsCutter),
            connectionState: 'idle',
          });
        } catch (e) {}
      }

      // 2. Register native listeners once
      printerService.onConnectionLost(() => {
        console.log(`${LOG_TAG} native connection lost callback triggered`);
        get().handleConnectionLost();
      });

      if (printerService.onBluetoothStateChanged) {
        printerService.onBluetoothStateChanged((state) => {
          console.log(`${LOG_TAG} adapter state changed ->`, state);
          set({ bluetoothState: state });
          if (state === 'OFF') {
            set({ connectionState: 'bluetooth-off', bondedDevices: [], pairedDevices: [] });
          } else {
            get().reconcileBluetoothState('bluetooth-on-event');
          }
        });
      }

      if (printerService.onDeviceConnected) {
        printerService.onDeviceConnected((device) => {
          console.log(`${LOG_TAG} native device connected ->`, device.name);
          const current = get().selectedPrinter;
          if (!current || getPrinterKey(current) === getPrinterKey(device)) {
            set({ selectedPrinter: device, connectionState: 'connected', userDisconnectedAddress: null });
            get().updateConfig({ selectedPrinter: device });
          }
        });
      }

      // 3. Register ONE debounced AppState listener
      if (!appStateSubscription) {
        appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
          if (nextState === 'active') {
            if (debounceReconcileTimer) clearTimeout(debounceReconcileTimer);
            debounceReconcileTimer = setTimeout(() => {
              console.log(`${LOG_TAG} AppState active -> debounced reconcile`);
              get().reconcileBluetoothState('AppState active');
            }, 350);
          }
        });
      }

      // 4. Run authoritative initial reconciliation
      await get().reconcileBluetoothState('init');
    } catch (err: any) {
      console.warn(`${LOG_TAG} initializePrinterSubsystem failed:`, err.message);
    }
  },

  reconcileBluetoothState: async (trigger = 'manual') => {
    const currentState = get();
    if (currentState.isReconciling) {
      console.log(`${LOG_TAG} reconcile skipped (already reconciling), trigger:`, trigger);
      return;
    }
    set({ isReconciling: true });
    console.log(`${LOG_TAG} reconcile start, trigger:`, trigger);

    try {
      // Step 1: Check Permissions
      const permState = await printerService.getPermissionState();
      set({ permissionState: permState });
      if (permState !== 'granted') {
        const nextConn = permState === 'denied' ? 'permission-denied' : 'permission-required';
        set({ 
          connectionState: nextConn, 
          isReconciling: false, 
          lastReconcileAt: Date.now() 
        });
        console.log(`${LOG_TAG} reconcile halted: permission is`, permState);
        return;
      }

      // Step 2: Check Bluetooth Adapter State
      const btState = await printerService.getBluetoothState();
      set({ bluetoothState: btState });
      if (btState !== 'ON') {
        set({ 
          connectionState: 'bluetooth-off', 
          isReconciling: false, 
          lastReconcileAt: Date.now() 
        });
        console.log(`${LOG_TAG} reconcile halted: bluetooth is`, btState);
        return;
      }

      // Step 3: Fetch Android Bonded Devices
      const bonded = await printerService.getBondedDevices();
      set({ 
        bondedDevices: bonded, 
        pairedDevices: bonded 
      });
      console.log(`${LOG_TAG} bonded devices count:`, bonded.length);

      // Step 4: Validate Selected Printer
      const currentSelected = get().selectedPrinter;
      if (currentSelected) {
        const currentKey = getPrinterKey(currentSelected);
        const stillBonded = bonded.find(d => getPrinterKey(d) === currentKey);

        if (!stillBonded) {
          // Device was manually unpaired in Android Settings
          console.log(`${LOG_TAG} selected printer was UNPAIRED in phone settings:`, currentSelected.name);
          try {
            await printerService.disconnect(currentSelected.address);
          } catch {}
          
          await get().updateConfig({ selectedPrinter: null });
          if (bonded.length > 0) {
            const likely = bonded.find(d => isLikelyPrinterName(d.name)) || bonded[0];
            set({ 
              selectedPrinter: likely, 
              connectionState: 'paired', 
              userDisconnectedAddress: null 
            });
            await get().updateConfig({ selectedPrinter: likely });
          } else {
            set({ 
              selectedPrinter: null, 
              connectionState: 'no-printer', 
              userDisconnectedAddress: null 
            });
          }
        } else {
          // Device is still bonded. Check real RFCOMM socket connection
          const isSocketConnected = await printerService.isConnected(stillBonded.address);
          console.log(`${LOG_TAG} socket connection verified for`, stillBonded.name, ':', isSocketConnected);

          if (isSocketConnected) {
            set({ 
              connectionState: 'connected', 
              userDisconnectedAddress: null 
            });
          } else {
            // Bonded, but socket is not currently connected
            const userDisconnected = get().userDisconnectedAddress === stillBonded.address;
            const canAutoReconnect = get().autoReconnect && !userDisconnected && !get().isConnecting;

            if (canAutoReconnect && (get().connectionState === 'idle' || get().connectionState === 'connection-lost')) {
              console.log(`${LOG_TAG} attempting controlled auto reconnect to:`, stillBonded.name);
              set({ connectionState: 'paired' });
              // Trigger controlled reconnect in background
              get().connectSelectedPrinter().catch(() => {});
            } else {
              if (get().connectionState === 'connected') {
                set({ connectionState: 'connection-lost' });
              } else if (get().connectionState !== 'connecting' && get().connectionState !== 'disconnecting') {
                set({ connectionState: 'paired' });
              }
            }
          }
        }
      } else {
        // No printer currently selected
        if (bonded.length > 0) {
          const likely = bonded.find(d => isLikelyPrinterName(d.name)) || bonded[0];
          set({ selectedPrinter: likely, connectionState: 'paired' });
          await get().updateConfig({ selectedPrinter: likely });
        } else {
          set({ connectionState: 'no-printer' });
        }
      }
    } catch (e: any) {
      console.warn(`${LOG_TAG} reconcile error:`, e.message);
    } finally {
      set({ isReconciling: false, lastReconcileAt: Date.now() });
      console.log(`${LOG_TAG} reconcile complete`);
    }
  },

  requestBluetoothPermission: async () => {
    console.log(`${LOG_TAG} user requested Bluetooth permission`);
    set({ connectionState: 'connecting' });
    const granted = await printerService.requestPermissions();
    if (granted) {
      set({ permissionState: 'granted' });
      await get().reconcileBluetoothState('permission-granted');
      return true;
    } else {
      set({ permissionState: 'denied', connectionState: 'permission-denied' });
      return false;
    }
  },

  openBluetoothSettings: async () => {
    await printerService.openBluetoothSettings();
  },

  refreshBondedDevices: async () => {
    await get().reconcileBluetoothState('manual-refresh');
    return get().bondedDevices;
  },

  selectPrinter: async (device) => {
    if (!device) {
      await get().updateConfig({ selectedPrinter: null });
      set({ selectedPrinter: null, connectionState: get().bondedDevices.length > 0 ? 'paired' : 'no-printer' });
      return;
    }
    console.log(`${LOG_TAG} selectPrinter:`, device.name, device.address);
    set({ selectedPrinter: device, userDisconnectedAddress: null });
    await get().updateConfig({ selectedPrinter: device });
    
    // Check if newly selected printer is already connected
    const isConn = await printerService.isConnected(device.address);
    if (isConn) {
      set({ connectionState: 'connected' });
    } else {
      set({ connectionState: device.bonded ? 'paired' : 'no-printer' });
    }
  },

  connectSelectedPrinter: async (targetDevice) => {
    if (targetDevice) {
      await get().selectPrinter(targetDevice);
    }
    const device = get().selectedPrinter;
    if (!device) {
      set({ lastError: 'No printer selected.' });
      return false;
    }

    // Mutex check: prevent concurrent RFCOMM connections
    if (connectionLockPromise) {
      console.log(`${LOG_TAG} connect already in progress, awaiting existing connection mutex...`);
      return connectionLockPromise;
    }

    const executeConnect = async (): Promise<boolean> => {
      set({ 
        isConnecting: true, 
        connectionState: 'connecting', 
        lastError: null, 
        userDisconnectedAddress: null 
      });
      console.log(`${LOG_TAG} state paired -> connecting`);

      try {
        // 1. Verify Permission
        const permGranted = await printerService.requestPermissions();
        if (!permGranted) {
          set({ 
            connectionState: 'permission-denied', 
            lastError: 'Bluetooth permission required.', 
            isConnecting: false 
          });
          return false;
        }

        // 2. Verify Bluetooth ON
        const btState = await printerService.getBluetoothState();
        if (btState !== 'ON') {
          set({ 
            connectionState: 'bluetooth-off', 
            lastError: 'Bluetooth is turned off.', 
            isConnecting: false 
          });
          return false;
        }

        // 3. Verify Still Bonded
        const bonded = await printerService.getBondedDevices();
        const stillBonded = bonded.some(d => getPrinterKey(d) === getPrinterKey(device));
        if (!stillBonded) {
          set({ 
            connectionState: 'no-printer', 
            lastError: `${device.name} is not paired in Android Bluetooth settings.`, 
            isConnecting: false 
          });
          await get().updateConfig({ selectedPrinter: null });
          return false;
        }

        // 4. Connect Native RFCOMM Socket
        await printerService.connect(device.address);

        // 5. Verify Socket Strictly
        const verified = await printerService.isConnected(device.address);
        if (!verified) {
          throw new Error('Socket could not be verified after connect.');
        }

        console.log(`${LOG_TAG} state connecting -> connected • ready`);
        set({ 
          connectionState: 'connected', 
          isConnecting: false, 
          lastError: null, 
          userDisconnectedAddress: null 
        });
        await get().updateConfig({ selectedPrinter: device });
        return true;
      } catch (err: any) {
        console.warn(`${LOG_TAG} connect failed:`, err.message);
        const friendly = getUserFriendlyPrinterError(err.code || 'CONNECTION_FAILED', err.message);
        set({ 
          connectionState: 'paired', 
          lastError: friendly, 
          isConnecting: false 
        });
        return false;
      } finally {
        connectionLockPromise = null;
      }
    };

    connectionLockPromise = executeConnect();
    return connectionLockPromise;
  },

  disconnectSelectedPrinter: async () => {
    const device = get().selectedPrinter;
    if (!device) return;

    if (get().isDisconnecting) return;

    set({ 
      isDisconnecting: true, 
      connectionState: 'disconnecting', 
      userDisconnectedAddress: device.address 
    });
    console.log(`${LOG_TAG} state -> disconnecting`);

    try {
      await printerService.disconnect(device.address);
      const isConn = await printerService.isConnected(device.address);
      console.log(`${LOG_TAG} disconnect socket closed:`, !isConn);
    } catch (e: any) {
      console.warn(`${LOG_TAG} disconnect error:`, e.message);
    } finally {
      // Device remains Android bonded! State becomes 'paired'
      set({ 
        isDisconnecting: false, 
        connectionState: 'paired' 
      });
      console.log(`${LOG_TAG} state -> paired with phone`);
    }
  },

  forgetSelectedPrinter: async () => {
    const device = get().selectedPrinter;
    if (device) {
      try {
        await printerService.disconnect(device.address);
      } catch {}
    }
    await get().updateConfig({ selectedPrinter: null });
    set({ 
      selectedPrinter: null, 
      connectionState: get().bondedDevices.length > 0 ? 'paired' : 'no-printer',
      userDisconnectedAddress: null,
      lastError: null 
    });
    console.log(`${LOG_TAG} forgot printer in Tasty Bites (Android OS bond retained)`);
  },

  ensureConnectedForPrint: async (): Promise<boolean> => {
    const { selectedPrinter } = get();
    if (!selectedPrinter) {
      set({ lastError: 'No printer selected.' });
      return false;
    }

    const isConn = await printerService.isConnected(selectedPrinter.address);
    if (isConn) {
      if (get().connectionState !== 'connected') {
        set({ connectionState: 'connected' });
      }
      return true;
    }

    console.log(`${LOG_TAG} printer not connected before write, attempting controlled connection...`);
    return get().connectSelectedPrinter();
  },

  testPrint: async (businessName = 'Tasty Bites') => {
    if (get().isPrinting) return false;
    if (writeLockPromise) return writeLockPromise;

    const doTestPrint = async (): Promise<boolean> => {
      set({ isPrinting: true, lastError: null });
      try {
        const connected = await get().ensureConnectedForPrint();
        if (!connected) {
          set({ isPrinting: false, lastError: 'Printer is not connected.' });
          return false;
        }

        const caps: PrinterCapabilities = {
          paperWidth: get().paperWidth,
          supportsCutter: get().supportsCutter,
        };

        console.log(`${LOG_TAG} test print write start`);
        const result = await printerService.printTest(caps, businessName);
        console.log(`${LOG_TAG} test print write result:`, result);
        set({ isPrinting: false });
        return true;
      } catch (e: any) {
        console.warn(`${LOG_TAG} test print error:`, e.message);
        const friendly = getUserFriendlyPrinterError(e.code || 'WRITE_FAILED', e.message);
        set({ isPrinting: false, lastError: friendly });
        return false;
      } finally {
        writeLockPromise = null;
      }
    };

    writeLockPromise = doTestPrint();
    return writeLockPromise;
  },

  printOrder: async (order: any) => {
    if (get().isPrinting) return false;
    if (writeLockPromise) return writeLockPromise;

    const doOrderPrint = async (): Promise<boolean> => {
      set({ isPrinting: true, lastError: null });
      try {
        const connected = await get().ensureConnectedForPrint();
        if (!connected) {
          set({ isPrinting: false, lastError: 'Printer is not connected.' });
          return false;
        }

        const caps: PrinterCapabilities = {
          paperWidth: get().paperWidth,
          supportsCutter: get().supportsCutter,
        };

        console.log(`${LOG_TAG} bill receipt write start for bill #`, order.billNumber);
        const result = await printerService.printReceipt(order, caps);
        console.log(`${LOG_TAG} bill receipt write success:`, result);
        set({ isPrinting: false });
        return true;
      } catch (e: any) {
        console.warn(`${LOG_TAG} bill receipt write error:`, e.message);
        const friendly = getUserFriendlyPrinterError(e.code || 'WRITE_FAILED', e.message);
        set({ isPrinting: false, lastError: friendly });
        return false;
      } finally {
        writeLockPromise = null;
      }
    };

    writeLockPromise = doOrderPrint();
    return writeLockPromise;
  },

  reprintOrder: async (order: any) => {
    if (!order) {
      return { success: false, status: 'FAILED' as const, error: 'No bill provided for reprint.' };
    }
    if (get().isPrinting) {
      return { success: false, status: 'FAILED' as const, error: 'Printer is currently printing.' };
    }
    if (writeLockPromise) {
      try { await writeLockPromise; } catch {}
    }

    const doReprint = async (): Promise<{ success: boolean; status: 'SUCCESS' | 'NO_PRINTER' | 'DISCONNECTED' | 'FAILED'; error?: string; updatedOrder?: any }> => {
      // 1. Reconcile Bluetooth state
      try {
        await get().reconcileBluetoothState('reprint');
      } catch (err) {
        console.warn(`${LOG_TAG} reconcile error before reprint:`, err);
      }

      // 2. Ensure selected printer exists
      const { selectedPrinter } = get();
      if (!selectedPrinter) {
        set({ lastError: 'No printer selected.' });
        return { success: false, status: 'NO_PRINTER', error: 'No printer selected' };
      }

      // 3. Ensure actual Bluetooth Classic socket is connected
      let isConn = false;
      try {
        isConn = await printerService.isConnected(selectedPrinter.address);
      } catch {
        isConn = false;
      }

      if (!isConn) {
        console.log(`${LOG_TAG} reprint: printer disconnected, attempting reconnection...`);
        const reconnected = await get().connectSelectedPrinter();
        if (!reconnected) {
          set({ lastError: 'Printer not connected.' });
          return { success: false, status: 'DISCONNECTED', error: 'Printer not connected' };
        }
      }

      // 4. Build receipt from SAVED immutable bill and send once
      set({ isPrinting: true, lastError: null });
      try {
        const caps: PrinterCapabilities = {
          paperWidth: get().paperWidth,
          supportsCutter: get().supportsCutter,
        };

        console.log(`${LOG_TAG} reprint write start for bill #`, order.billNumber);
        const result = await printerService.printReceipt(order, caps);
        console.log(`${LOG_TAG} reprint write success:`, result);
        set({ isPrinting: false });

        if (!result) {
          set({ lastError: 'Receipt could not be sent to printer.' });
          return { success: false, status: 'FAILED', error: 'Receipt could not be sent to printer.' };
        }

        // 5. Only after successful send: increment reprint count
        let updatedOrder = order;
        const orderDbId = order._id || order.id;
        if (orderDbId) {
          try {
            const resp = await ordersApi.reprintOrder(orderDbId);
            if (resp) {
              updatedOrder = resp;
            }
          } catch (syncErr: any) {
            console.warn(`${LOG_TAG} failed to sync reprint count to backend:`, syncErr?.message);
            updatedOrder = { ...order, printCount: (order.printCount || 0) + 1 };
          }
        }

        return { success: true, status: 'SUCCESS', updatedOrder };
      } catch (e: any) {
        console.warn(`${LOG_TAG} reprint write error:`, e.message);
        const friendly = getUserFriendlyPrinterError(e.code || 'WRITE_FAILED', e.message);
        set({ isPrinting: false, lastError: friendly });
        return { success: false, status: 'FAILED', error: friendly || 'Receipt could not be sent to printer.' };
      } finally {
        writeLockPromise = null;
      }
    };

    const task = doReprint();
    writeLockPromise = task.then(r => r.success);
    return task;
  },

  handleConnectionLost: () => {
    console.log(`${LOG_TAG} handleConnectionLost called`);
    if (get().connectionState === 'connected') {
      set({ connectionState: 'connection-lost' });
    }
  },

  clearPrinterError: () => {
    set({ lastError: null });
  },

  scan: async () => {
    const btState = await printerService.getBluetoothState();
    if (btState !== 'ON') {
      set({ bluetoothState: btState, lastError: 'Bluetooth is turned off.' });
      return;
    }

    set({ isScanning: true, nearbyDevices: [], lastError: null });
    try {
      await printerService.startDiscovery((device) => {
        set((state) => {
          const key = getPrinterKey(device);
          if (state.nearbyDevices.some(d => getPrinterKey(d) === key)) return state;
          if (state.bondedDevices.some(d => getPrinterKey(d) === key)) return state;
          return { nearbyDevices: [...state.nearbyDevices, device] };
        });
      });
    } catch (e: any) {
      set({ lastError: e.message || 'Discovery failed.' });
    } finally {
      set({ isScanning: false });
    }
  },

  stopScan: async () => {
    await printerService.stopScan();
    set({ isScanning: false });
  },

  updateConfig: async (updates) => {
    set((state) => {
      const updatedPrinter = updates.selectedPrinter !== undefined ? updates.selectedPrinter : state.selectedPrinter;
      const safePrinter = updatedPrinter ? { ...updatedPrinter, connected: false } : null;
      const newConfig = {
        selectedPrinter: updatedPrinter,
        paperWidth: updates.paperWidth !== undefined ? updates.paperWidth : state.paperWidth,
        autoPrint: updates.autoPrint !== undefined ? updates.autoPrint : state.autoPrint,
        autoReconnect: updates.autoReconnect !== undefined ? updates.autoReconnect : state.autoReconnect,
        supportsCutter: updates.supportsCutter !== undefined ? updates.supportsCutter : state.supportsCutter,
      };
      SecureStore.setItemAsync(PRINTER_STORE_KEY, JSON.stringify({ ...newConfig, selectedPrinter: safePrinter })).catch(() => {});
      return newConfig;
    });
  },

  // Backwards compatible aliases
  init: async () => {
    return get().initializePrinterSubsystem();
  },
  requestPermissions: async () => {
    return get().requestBluetoothPermission();
  },
  requestEnableBluetooth: async () => {
    if (printerService.requestBluetoothEnabled) {
      const ok = await printerService.requestBluetoothEnabled();
      if (ok) {
        set({ bluetoothState: 'ON' });
        await get().reconcileBluetoothState('request-enable');
        return true;
      }
    }
    return false;
  },
  checkBluetoothState: async () => {
    const s = await printerService.getBluetoothState();
    set({ bluetoothState: s });
    return s;
  },
  checkConnection: async () => {
    const sel = get().selectedPrinter;
    if (!sel) return false;
    const ok = await printerService.isConnected(sel.address);
    if (ok && get().connectionState !== 'connected') {
      set({ connectionState: 'connected' });
    } else if (!ok && get().connectionState === 'connected') {
      set({ connectionState: 'connection-lost' });
    }
    return ok;
  },
  refreshPairedDevices: async () => {
    await get().refreshBondedDevices();
  },
  connect: async () => {
    return get().connectSelectedPrinter();
  },
  connectDevice: async (dev: PrinterDevice) => {
    return get().connectSelectedPrinter(dev);
  },
  disconnect: async () => {
    return get().disconnectSelectedPrinter();
  },
  forget: async () => {
    return get().forgetSelectedPrinter();
  },
}));
