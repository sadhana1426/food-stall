import { create } from 'zustand';
import { printerService, PrinterDevice, PrinterConnectionState, PaperWidth, PrinterCapabilities, PrinterError } from '../services/printer';
import * as SecureStore from 'expo-secure-store';

const PRINTER_STORE_KEY = 'tasty_bites_printer_config';

interface PrinterConfig {
  selectedPrinter: PrinterDevice | null;
  paperWidth: PaperWidth;
  autoPrint: boolean;
  autoReconnect: boolean;
  supportsCutter: boolean;
}

interface PrinterState extends PrinterConfig {
  bluetoothState: 'ON' | 'OFF' | 'UNSUPPORTED' | 'UNKNOWN';
  connectionState: PrinterConnectionState;
  
  pairedDevices: PrinterDevice[];
  nearbyDevices: PrinterDevice[];
  
  isScanning: boolean;
  isPrinting: boolean;
  lastError: string | null;

  init: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  refreshPairedDevices: () => Promise<void>;
  scan: () => Promise<void>;
  stopScan: () => Promise<void>;
  
  selectPrinter: (device: PrinterDevice | null) => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  forget: () => Promise<void>;
  
  updateConfig: (config: Partial<PrinterConfig>) => Promise<void>;
  
  testPrint: (businessName: string) => Promise<boolean>;
  printOrder: (order: any) => Promise<boolean>;
}

const DEFAULT_CONFIG: PrinterConfig = {
  selectedPrinter: null,
  paperWidth: '58mm',
  autoPrint: false,
  autoReconnect: true,
  supportsCutter: false,
};

export const usePrinterStore = create<PrinterState>((set, get) => ({
  ...DEFAULT_CONFIG,
  
  bluetoothState: 'UNKNOWN',
  connectionState: 'IDLE',
  
  pairedDevices: [],
  nearbyDevices: [],
  
  isScanning: false,
  isPrinting: false,
  lastError: null,

  init: async () => {
    try {
      const stored = await SecureStore.getItemAsync(PRINTER_STORE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        set({ ...config });
      }
      
      const btState = await printerService.getBluetoothState();
      set({ bluetoothState: btState });

      printerService.onConnectionLost(() => {
        set({ connectionState: 'DISCONNECTED' });
      });

      const { selectedPrinter, autoReconnect } = get();
      if (selectedPrinter && autoReconnect && btState === 'ON') {
        get().connect();
      }
    } catch (e) {}
  },

  updateConfig: async (updates) => {
    set((state) => {
      const newConfig = {
        selectedPrinter: updates.selectedPrinter !== undefined ? updates.selectedPrinter : state.selectedPrinter,
        paperWidth: updates.paperWidth !== undefined ? updates.paperWidth : state.paperWidth,
        autoPrint: updates.autoPrint !== undefined ? updates.autoPrint : state.autoPrint,
        autoReconnect: updates.autoReconnect !== undefined ? updates.autoReconnect : state.autoReconnect,
        supportsCutter: updates.supportsCutter !== undefined ? updates.supportsCutter : state.supportsCutter,
      };
      SecureStore.setItemAsync(PRINTER_STORE_KEY, JSON.stringify(newConfig)).catch(() => {});
      return newConfig;
    });
  },

  requestPermissions: async () => {
    set({ connectionState: 'PERMISSION_REQUIRED' });
    const granted = await printerService.requestPermissions();
    if (granted) {
      set({ connectionState: 'IDLE' });
      const btState = await printerService.getBluetoothState();
      set({ bluetoothState: btState });
    }
    return granted;
  },

  refreshPairedDevices: async () => {
    try {
      const devices = await printerService.getPairedDevices();
      set({ pairedDevices: devices });
    } catch (e) {}
  },

  scan: async () => {
    const btState = await printerService.getBluetoothState();
    if (btState !== 'ON') {
      set({ bluetoothState: btState, lastError: 'Bluetooth is off' });
      return;
    }
    
    set({ isScanning: true, nearbyDevices: [], connectionState: 'SCANNING', lastError: null });
    
    try {
      await printerService.scanDevices((device) => {
        set((state) => {
          // Prevent duplicates
          if (state.nearbyDevices.find(d => d.id === device.id)) return state;
          // Don't show paired devices in nearby if they're already in paired list
          if (state.pairedDevices.find(d => d.id === device.id)) return state;
          
          return { nearbyDevices: [...state.nearbyDevices, device] };
        });
      });
    } catch (e: any) {
      set({ lastError: e.message });
    } finally {
      set({ isScanning: false, connectionState: 'IDLE' });
    }
  },

  stopScan: async () => {
    await printerService.stopScan();
    set({ isScanning: false, connectionState: 'IDLE' });
  },

  selectPrinter: async (device) => {
    await get().updateConfig({ selectedPrinter: device });
  },

  connect: async () => {
    const { selectedPrinter } = get();
    if (!selectedPrinter) return false;
    
    set({ connectionState: 'CONNECTING', lastError: null });
    try {
      if (!selectedPrinter.bonded) {
        set({ connectionState: 'PAIRING' });
        await printerService.pairDevice(selectedPrinter.id);
      }
      
      const success = await printerService.connect(selectedPrinter.id);
      if (success) {
        set({ connectionState: 'CONNECTED' });
        // Update bonded status if newly paired
        if (!selectedPrinter.bonded) {
          await get().updateConfig({ selectedPrinter: { ...selectedPrinter, bonded: true } });
          get().refreshPairedDevices();
        }
        return true;
      }
      set({ connectionState: 'DISCONNECTED', lastError: 'Failed to connect.' });
      return false;
    } catch (e: any) {
      set({ connectionState: 'ERROR', lastError: e.message || 'Connection failed' });
      return false;
    }
  },

  disconnect: async () => {
    await printerService.disconnect();
    set({ connectionState: 'DISCONNECTED' });
  },

  forget: async () => {
    await get().disconnect();
    await get().updateConfig({ selectedPrinter: null });
    set({ connectionState: 'IDLE', lastError: null });
  },

  testPrint: async (businessName: string) => {
    set({ isPrinting: true, lastError: null });
    try {
      const caps: PrinterCapabilities = {
        paperWidth: get().paperWidth,
        supportsCutter: get().supportsCutter,
      };
      await printerService.printTest(caps, businessName);
      set({ isPrinting: false });
      return true;
    } catch (e: any) {
      set({ isPrinting: false, lastError: e.message || 'Test print failed' });
      return false;
    }
  },

  printOrder: async (order: any) => {
    // If not connected, attempt quick silent reconnect
    if (get().connectionState !== 'CONNECTED') {
      const connected = await get().connect();
      if (!connected) return false;
    }

    set({ isPrinting: true, lastError: null });
    try {
      const caps: PrinterCapabilities = {
        paperWidth: get().paperWidth,
        supportsCutter: get().supportsCutter,
      };
      await printerService.printReceipt(order, caps);
      set({ isPrinting: false });
      return true;
    } catch (e: any) {
      set({ isPrinting: false, lastError: e.message || 'Print failed' });
      return false;
    }
  },
}));
