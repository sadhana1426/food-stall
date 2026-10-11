export type PrinterConnectionState =
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

export type PrinterTransport = 'CLASSIC' | 'BLE' | 'MOCK';

export interface PrinterDevice {
  id: string;
  name: string;
  address?: string;
  transport: PrinterTransport;
  bonded?: boolean;
  rssi?: number;
}

export type PaperWidth = '58mm' | '80mm';

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
  getBluetoothState(): Promise<'ON' | 'OFF' | 'UNSUPPORTED' | 'UNKNOWN'>;
  requestPermissions(): Promise<boolean>;
  getPairedDevices(): Promise<PrinterDevice[]>;
  scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void>;
  stopScan(): Promise<void>;
  pairDevice(deviceId: string): Promise<boolean>;
  connect(deviceId: string): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  printTest(capabilities: PrinterCapabilities, businessName: string): Promise<boolean>;
  printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean>;
  onConnectionLost(callback: () => void): () => void;
}
