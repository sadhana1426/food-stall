import { 
  PrinterService, 
  PrinterDevice, 
  PrinterCapabilities, 
  PermissionState, 
  BluetoothAdapterState 
} from './printerTypes';
import { PrinterError } from './printerErrors';

const MOCK_DEVICES: PrinterDevice[] = [
  { id: '00:11:22:33:44:55', name: 'POS-58 (Mock)', address: '00:11:22:33:44:55', transport: 'MOCK', bonded: true },
  { id: '66:77:88:99:AA:BB', name: 'XP-80 (Mock)', address: '66:77:88:99:AA:BB', transport: 'MOCK', bonded: false },
];

export class MockPrinterService implements PrinterService {
  private connectedDeviceAddress: string | null = null;
  private connectionLostCallbacks: Array<() => void> = [];
  
  async getPermissionState(): Promise<PermissionState> {
    return 'granted';
  }

  async getBluetoothState(): Promise<BluetoothAdapterState> {
    return 'ON';
  }

  async requestBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async openBluetoothSettings(): Promise<void> {
    return;
  }

  async getBondedDevices(): Promise<PrinterDevice[]> {
    return MOCK_DEVICES.filter(d => d.bonded);
  }

  async getPairedDevices(): Promise<PrinterDevice[]> {
    return this.getBondedDevices();
  }

  async getConnectedDevices(): Promise<PrinterDevice[]> {
    if (this.connectedDeviceAddress) {
      return MOCK_DEVICES.filter(d => d.address === this.connectedDeviceAddress).map(d => ({ ...d, connected: true }));
    }
    return [];
  }

  async startDiscovery(onDeviceFound?: (device: PrinterDevice) => void): Promise<PrinterDevice[]> {
    if (onDeviceFound) {
      setTimeout(() => onDeviceFound(MOCK_DEVICES[1]), 500);
    }
    return [MOCK_DEVICES[1]];
  }

  async scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void> {
    await this.startDiscovery(onDeviceFound);
  }

  async stopScan(): Promise<void> {
    return;
  }

  async pairDevice(address: string): Promise<boolean> {
    return true;
  }

  async connect(address: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connectedDeviceAddress = address;
        resolve(true);
      }, 500);
    });
  }

  async disconnect(): Promise<void> {
    this.connectedDeviceAddress = null;
    this.connectionLostCallbacks.forEach(cb => cb());
  }

  async isConnected(address?: string): Promise<boolean> {
    if (!this.connectedDeviceAddress) return false;
    if (address && address !== this.connectedDeviceAddress) return false;
    return true;
  }

  async isDeviceConnected(address: string): Promise<boolean> {
    return this.connectedDeviceAddress === address;
  }

  async write(address: string, payload: Uint8Array | string): Promise<boolean> {
    if (!this.connectedDeviceAddress) throw new PrinterError('CONNECTION_LOST', 'Disconnected');
    return true;
  }

  onConnectionLost(callback: () => void): () => void {
    this.connectionLostCallbacks.push(callback);
    return () => {
      this.connectionLostCallbacks = this.connectionLostCallbacks.filter(cb => cb !== callback);
    };
  }

  async printTest(capabilities: PrinterCapabilities, businessName: string): Promise<boolean> {
    if (!this.connectedDeviceAddress) throw new PrinterError('CONNECTION_LOST', 'Disconnected');
    console.log(`[MOCK PRINTER] Printed test for ${businessName} at ${capabilities.paperWidth}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 500));
  }

  async printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean> {
    if (!this.connectedDeviceAddress) throw new PrinterError('CONNECTION_LOST', 'Disconnected');
    console.log(`[MOCK PRINTER] Printed bill #${order.billNumber} at ${capabilities.paperWidth}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 500));
  }
}
