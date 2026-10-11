import { Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { 
  PrinterService, 
  PrinterDevice, 
  PrinterCapabilities, 
  PrinterConnectionState 
} from './printerTypes';
import { PrinterError } from './printerErrors';
import { EscPosEncoder, formatTwoColumns, formatThreeColumns } from './EscPosEncoder';
import { formatMoney } from '../../utils/money';

export class BluetoothPrinterService implements PrinterService {
  private connectedDeviceId: string | null = null;
  private connectionLostCallbacks: Array<() => void> = [];

  constructor() {
    RNBluetoothClassic.onDeviceDisconnected((event) => {
      if (event.device.address === this.connectedDeviceId) {
        this.connectedDeviceId = null;
        this.connectionLostCallbacks.forEach(cb => cb());
      }
    });
  }

  async getBluetoothState(): Promise<'ON' | 'OFF' | 'UNSUPPORTED' | 'UNKNOWN'> {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      return enabled ? 'ON' : 'OFF';
    } catch (e) {
      return 'UNSUPPORTED';
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    
    const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
    if (androidVersion >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
             result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  async getPairedDevices(): Promise<PrinterDevice[]> {
    try {
      const devices = await RNBluetoothClassic.getBondedDevices();
      return devices.map(d => ({
        id: d.address,
        name: d.name || 'Unknown Device',
        address: d.address,
        transport: 'CLASSIC',
        bonded: true,
      }));
    } catch (e: any) {
      throw new PrinterError('UNKNOWN', e.message);
    }
  }

  async scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void> {
    try {
      const devices = await RNBluetoothClassic.startDiscovery();
      devices.forEach(d => {
        onDeviceFound({
          id: d.address,
          name: d.name || 'Unknown Device',
          address: d.address,
          transport: 'CLASSIC',
          bonded: false,
        });
      });
    } catch (e: any) {
      throw new PrinterError('DEVICE_NOT_FOUND', e.message);
    }
  }

  async stopScan(): Promise<void> {
    try {
      await RNBluetoothClassic.cancelDiscovery();
    } catch (e) {}
  }

  async pairDevice(deviceId: string): Promise<boolean> {
    // BluetoothClassic pairs on connection if not bonded
    return true;
  }

  async connect(deviceId: string): Promise<boolean> {
    try {
      // Connect to the device
      const connected = await RNBluetoothClassic.connectToDevice(deviceId);
      if (connected) {
        this.connectedDeviceId = deviceId;
        return true;
      }
      throw new PrinterError('CONNECTION_FAILED', 'Failed to connect to printer.');
    } catch (e: any) {
      throw new PrinterError('CONNECTION_FAILED', e.message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDeviceId) {
      try {
        await RNBluetoothClassic.disconnectFromDevice(this.connectedDeviceId);
      } catch (e) {}
      this.connectedDeviceId = null;
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.connectedDeviceId) return false;
    try {
      const connected = await RNBluetoothClassic.isDeviceConnected(this.connectedDeviceId);
      if (!connected) {
        this.connectedDeviceId = null;
      }
      return connected;
    } catch (e) {
      return false;
    }
  }

  onConnectionLost(callback: () => void): () => void {
    this.connectionLostCallbacks.push(callback);
    return () => {
      this.connectionLostCallbacks = this.connectionLostCallbacks.filter(cb => cb !== callback);
    };
  }

  async printTest(capabilities: PrinterCapabilities, businessName: string): Promise<boolean> {
    if (!this.connectedDeviceId) throw new PrinterError('CONNECTION_LOST', 'Printer disconnected.');

    const encoder = new EscPosEncoder();
    encoder
      .initialize()
      .alignCenter()
      .size(2, 2).bold(true).line('TASTY BITES').size(1, 1).bold(false)
      .newline()
      .line('Printer Connected Successfully')
      .newline()
      .alignLeft()
      .line(`Printer: ${businessName}`)
      .line(`Paper: ${capabilities.paperWidth}`)
      .line(`Date: ${new Date().toLocaleString()}`)
      .newline()
      .separator(capabilities.paperWidth)
      .alignCenter()
      .line('Test print successful')
      .separator(capabilities.paperWidth)
      .paperFeed(3);

    if (capabilities.supportsCutter) {
      encoder.cut();
    }

    const data = encoder.build();
    try {
      // Convert Uint8Array to base64 for writing
      const base64Str = btoa(String.fromCharCode.apply(null, Array.from(data)));
      await RNBluetoothClassic.writeToDevice(this.connectedDeviceId, base64Str, 'base64');
      return true;
    } catch (e: any) {
      throw new PrinterError('WRITE_FAILED', e.message);
    }
  }

  async printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean> {
    if (!this.connectedDeviceId) throw new PrinterError('CONNECTION_LOST', 'Printer disconnected.');

    const encoder = new EscPosEncoder();
    encoder.initialize().alignCenter();

    // Header
    encoder.size(2, 2).bold(true).line(order.businessSnapshot?.name || 'Tasty Bites').size(1, 1).bold(false);
    if (order.businessSnapshot?.address) encoder.line(order.businessSnapshot.address);
    if (order.businessSnapshot?.phone) encoder.line(`Ph: ${order.businessSnapshot.phone}`);
    encoder.separator(capabilities.paperWidth);

    // Meta
    encoder.alignLeft();
    encoder.line(`Bill No: ${order.billNumber}`);
    encoder.line(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    encoder.line(`Type: ${order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In'}`);
    encoder.separator(capabilities.paperWidth);

    // Items Header
    encoder.line(formatThreeColumns('Item', 'Qty', 'Amount', capabilities.paperWidth));
    encoder.separator(capabilities.paperWidth);

    // Items
    (order.items || []).forEach((item: any) => {
      const name = item.itemName || item.name;
      const qty = item.quantity.toString();
      const amt = formatMoney(item.lineTotalPaise);
      encoder.line(formatThreeColumns(name, qty, amt, capabilities.paperWidth));
    });
    encoder.separator(capabilities.paperWidth);

    // Totals
    encoder.line(formatTwoColumns('Subtotal', formatMoney(order.subtotalPaise), capabilities.paperWidth));
    if (order.discountAmountPaise > 0) {
      encoder.line(formatTwoColumns('Discount', `-${formatMoney(order.discountAmountPaise)}`, capabilities.paperWidth));
    }
    if (order.taxAmountPaise > 0) {
      encoder.line(formatTwoColumns(`Tax (${order.taxRate}%)`, `+${formatMoney(order.taxAmountPaise)}`, capabilities.paperWidth));
    }
    encoder.separator(capabilities.paperWidth);
    
    encoder.size(1, 2).bold(true);
    encoder.line(formatTwoColumns('TOTAL', `Rs ${formatMoney(order.grandTotalPaise)}`, capabilities.paperWidth));
    encoder.size(1, 1).bold(false);
    encoder.separator(capabilities.paperWidth);

    // Footer
    encoder.alignCenter();
    encoder.line(order.businessSnapshot?.receiptFooter || 'Thank You! Visit Again.');
    
    // Print Count
    if (order.printCount > 0) {
      encoder.newline().line(`(Reprint ${order.printCount})`);
    }

    encoder.paperFeed(3);
    if (capabilities.supportsCutter) {
      encoder.cut();
    }

    const data = encoder.build();
    try {
      const base64Str = btoa(String.fromCharCode.apply(null, Array.from(data)));
      await RNBluetoothClassic.writeToDevice(this.connectedDeviceId, base64Str, 'base64');
      return true;
    } catch (e: any) {
      throw new PrinterError('WRITE_FAILED', e.message);
    }
  }
}
