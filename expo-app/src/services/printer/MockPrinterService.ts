import { PrinterService, PrinterDevice, PrinterCapabilities } from './printerTypes';
import { PrinterError } from './printerErrors';

const MOCK_DEVICES: PrinterDevice[] = [
  { id: 'mock-1', name: 'POS-58 (Mock)', address: '00:11:22:33:44:55', transport: 'MOCK', bonded: true },
  { id: 'mock-2', name: 'XP-80 (Mock)', address: '66:77:88:99:AA:BB', transport: 'MOCK', bonded: false },
];

export class MockPrinterService implements PrinterService {
  private connectedDeviceId: string | null = null;
  private connectionLostCallbacks: Array<() => void> = [];
  
  async getBluetoothState(): Promise<'ON' | 'OFF' | 'UNSUPPORTED' | 'UNKNOWN'> {
    return 'ON';
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async getPairedDevices(): Promise<PrinterDevice[]> {
    return MOCK_DEVICES.filter(d => d.bonded);
  }

  async scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => onDeviceFound(MOCK_DEVICES[1]), 1000);
      setTimeout(() => resolve(), 3000);
    });
  }

  async stopScan(): Promise<void> {
    return;
  }

  async pairDevice(deviceId: string): Promise<boolean> {
    return true;
  }

  async connect(deviceId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (deviceId.startsWith('mock')) {
          this.connectedDeviceId = deviceId;
          resolve(true);
        } else {
          reject(new PrinterError('CONNECTION_FAILED', 'Mock connection failed'));
        }
      }, 1500);
    });
  }

  async disconnect(): Promise<void> {
    this.connectedDeviceId = null;
    this.connectionLostCallbacks.forEach(cb => cb());
  }

  async isConnected(): Promise<boolean> {
    return this.connectedDeviceId !== null;
  }

  onConnectionLost(callback: () => void): () => void {
    this.connectionLostCallbacks.push(callback);
    return () => {
      this.connectionLostCallbacks = this.connectionLostCallbacks.filter(cb => cb !== callback);
    };
  }

  async printTest(capabilities: PrinterCapabilities, businessName: string): Promise<boolean> {
    if (!this.connectedDeviceId) throw new PrinterError('CONNECTION_LOST', 'Disconnected');
    console.log(`[MOCK PRINTER] Printed test for ${businessName} at ${capabilities.paperWidth}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }

  async printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean> {
    if (!this.connectedDeviceId) throw new PrinterError('CONNECTION_LOST', 'Disconnected');
    console.log(`[MOCK PRINTER] Printed bill #${order.billNumber} at ${capabilities.paperWidth}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }
}
