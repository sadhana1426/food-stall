export type PrinterConnectionState =
  | 'idle'
  | 'permission-required'
  | 'permission-denied'
  | 'bluetooth-off'
  | 'no-printer'
  | 'paired'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'connection-lost'
  | 'error'
  // Legacy aliases for backward compatibility if any screen references uppercase:
  | 'IDLE'
  | 'PERMISSION_REQUIRED'
  | 'BLUETOOTH_OFF'
  | 'SCANNING'
  | 'PAIRING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'PRINTING'
  | 'DISCONNECTED'
  | 'ERROR';

export type PermissionState = 'granted' | 'denied' | 'undetermined';
export type BluetoothAdapterState = 'ON' | 'OFF' | 'UNSUPPORTED' | 'UNKNOWN';

export type PrinterTransport = 'CLASSIC' | 'BLE' | 'MOCK';

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
  bonded: boolean;
  transport: PrinterTransport;
  connected?: boolean;
  rssi?: number;
}

export function getPrinterKey(device: PrinterDevice | null | undefined): string {
  if (!device) return '';
  return (device.address || device.id || '').toUpperCase().trim();
}

export type PaperWidth = '50mm' | '58mm' | '80mm';

export interface PrinterCapabilities {
  paperWidth: PaperWidth;
  supportsCutter: boolean;
  supportsBold?: boolean;
  supportsDoubleSize?: boolean;
  encoding?: string;
}

export interface PrintJob {
  jobId: string;
  orderId: string;
  billNumber: string;
  printerId: string;
  status: 'PENDING' | 'CONNECTING' | 'PRINTING' | 'SENT' | 'FAILED' | 'UNKNOWN';
  attemptCount: number;
  lastErrorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterService {
  requestPermissions(): Promise<boolean>;
  getPermissionState(): Promise<PermissionState>;
  getBluetoothState(): Promise<BluetoothAdapterState>;
  requestBluetoothEnabled?(): Promise<boolean>;
  openBluetoothSettings(): Promise<void>;
  getBondedDevices(): Promise<PrinterDevice[]>;
  getPairedDevices(): Promise<PrinterDevice[]>;
  getConnectedDevices?(): Promise<PrinterDevice[]>;
  startDiscovery(onDeviceFound?: (device: PrinterDevice) => void): Promise<PrinterDevice[]>;
  scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void>;
  stopScan(): Promise<void>;
  cancelDiscovery?(): Promise<void>;
  pairDevice?(address: string): Promise<boolean>;
  connect(address: string): Promise<boolean>;
  disconnect(address?: string): Promise<void>;
  isConnected(address?: string): Promise<boolean>;
  isDeviceConnected?(address: string): Promise<boolean>;
  write(address: string, payload: Uint8Array | string): Promise<boolean>;
  printTest(capabilities: PrinterCapabilities, businessName: string): Promise<boolean>;
  printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean>;
  subscribeToAdapterEvents?(onEnabled: () => void, onDisabled: () => void): () => void;
  subscribeToConnectionEvents?(
    onConnected: (device: PrinterDevice) => void,
    onDisconnected: (address: string) => void
  ): () => void;
  onConnectionLost(callback: () => void): () => void;
  onBluetoothStateChanged?(callback: (state: 'ON' | 'OFF') => void): () => void;
  onDeviceConnected?(callback: (device: PrinterDevice) => void): () => void;
}
