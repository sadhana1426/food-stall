import { Platform, PermissionsAndroid, Linking } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { 
  PrinterService, 
  PrinterDevice, 
  PrinterCapabilities, 
  PermissionState,
  BluetoothAdapterState,
  getPrinterKey
} from './printerTypes';
import { PrinterError } from './printerErrors';
import { buildReceiptBytes, buildTestPrintBytes } from './ReceiptFormatter';
import { EscPosEncoder, formatTwoColumns, formatThreeColumns } from './EscPosEncoder';
import { formatMoney } from '../../utils/money';

const LOG_TAG = '[Printer]';

export class BluetoothPrinterService implements PrinterService {
  private connectedDeviceAddress: string | null = null;
  private connectionLostCallbacks: Array<() => void> = [];
  private stateChangeCallbacks: Array<(state: 'ON' | 'OFF') => void> = [];
  private deviceConnectedCallbacks: Array<(device: PrinterDevice) => void> = [];
  private isScanning = false;

  constructor() {
    this.setupNativeListeners();
  }

  private setupNativeListeners(): void {
    if (!RNBluetoothClassic) return;

    try {
      if (typeof (RNBluetoothClassic as any).onDeviceDisconnected === 'function') {
        (RNBluetoothClassic as any).onDeviceDisconnected((event: any) => {
          const disconnectedAddress = event?.device?.address || event?.address;
          console.log(`${LOG_TAG} native disconnect event for:`, disconnectedAddress);
          if (disconnectedAddress && this.connectedDeviceAddress && 
              disconnectedAddress.toUpperCase() === this.connectedDeviceAddress.toUpperCase()) {
            this.connectedDeviceAddress = null;
          }
          this.connectionLostCallbacks.forEach(cb => {
            try { cb(); } catch (e) { console.warn(`${LOG_TAG} error in disconnect callback`, e); }
          });
        });
      }

      if (typeof (RNBluetoothClassic as any).onBluetoothEnabled === 'function') {
        (RNBluetoothClassic as any).onBluetoothEnabled(() => {
          console.log(`${LOG_TAG} bluetooth ON event`);
          this.stateChangeCallbacks.forEach(cb => {
            try { cb('ON'); } catch (e) {}
          });
        });
      }

      if (typeof (RNBluetoothClassic as any).onBluetoothDisabled === 'function') {
        (RNBluetoothClassic as any).onBluetoothDisabled(() => {
          console.log(`${LOG_TAG} bluetooth OFF event`);
          this.connectedDeviceAddress = null;
          this.stateChangeCallbacks.forEach(cb => {
            try { cb('OFF'); } catch (e) {}
          });
          this.connectionLostCallbacks.forEach(cb => {
            try { cb(); } catch (e) {}
          });
        });
      }

      if (typeof (RNBluetoothClassic as any).onDeviceConnected === 'function') {
        (RNBluetoothClassic as any).onDeviceConnected((event: any) => {
          if (event && event.device) {
            const dev = this.normalizeNativeDevice(event.device, true);
            console.log(`${LOG_TAG} native device connected event:`, dev.name, dev.address);
            this.connectedDeviceAddress = dev.address;
            this.deviceConnectedCallbacks.forEach(cb => {
              try { cb(dev); } catch (e) {}
            });
          }
        });
      }
    } catch (err) {
      console.warn(`${LOG_TAG} failed to register native listeners`, err);
    }
  }

  private normalizeNativeDevice(d: any, isBonded: boolean = true): PrinterDevice {
    const addr = (d.address || d.id || '').toUpperCase().trim();
    return {
      id: addr,
      address: addr,
      name: d.name || 'Bluetooth Device',
      bonded: isBonded,
      transport: 'CLASSIC',
      connected: Boolean(d.connected),
    };
  }

  async getPermissionState(): Promise<PermissionState> {
    if (Platform.OS !== 'android') return 'granted';
    try {
      const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      if (androidVersion >= 31) {
        const hasConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        const hasScan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        if (hasConnect && hasScan) return 'granted';
        return 'undetermined';
      } else {
        const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return hasLocation ? 'granted' : 'undetermined';
      }
    } catch {
      return 'undetermined';
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
      console.log(`${LOG_TAG} requesting permissions for Android SDK`, androidVersion);
      if (androidVersion >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const connectGranted = result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
        const scanGranted = result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
        const granted = connectGranted || scanGranted;
        console.log(`${LOG_TAG} permissions result: connect=${connectGranted}, scan=${scanGranted}`);
        return granted;
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log(`${LOG_TAG} legacy permission result: location=${granted}`);
        return granted;
      }
    } catch (e: any) {
      console.warn(`${LOG_TAG} requestPermissions error:`, e.message);
      return false;
    }
  }

  async getBluetoothState(): Promise<BluetoothAdapterState> {
    try {
      if (!RNBluetoothClassic || typeof (RNBluetoothClassic as any).isBluetoothEnabled !== 'function') {
        return 'UNSUPPORTED';
      }
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      return enabled ? 'ON' : 'OFF';
    } catch (e) {
      return 'OFF';
    }
  }

  async requestBluetoothEnabled(): Promise<boolean> {
    try {
      if (RNBluetoothClassic && typeof (RNBluetoothClassic as any).requestBluetoothEnabled === 'function') {
        const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
        console.log(`${LOG_TAG} requestBluetoothEnabled result:`, enabled);
        return enabled;
      }
      return false;
    } catch (e: any) {
      console.warn(`${LOG_TAG} requestBluetoothEnabled error:`, e.message);
      return false;
    }
  }

  async openBluetoothSettings(): Promise<void> {
    console.log(`${LOG_TAG} opening Android Bluetooth settings`);
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
        return;
      } catch (intentErr) {
        try {
          if (RNBluetoothClassic && typeof (RNBluetoothClassic as any).openBluetoothSettings === 'function') {
            (RNBluetoothClassic as any).openBluetoothSettings();
            return;
          }
        } catch (rnErr) {}
      }
    }
    await Linking.openSettings();
  }

  async getBondedDevices(): Promise<PrinterDevice[]> {
    try {
      if (!RNBluetoothClassic || typeof (RNBluetoothClassic as any).getBondedDevices !== 'function') {
        return [];
      }
      const rawDevices = await RNBluetoothClassic.getBondedDevices();
      const list = (rawDevices || []).map((d: any) => this.normalizeNativeDevice(d, true));
      console.log(`${LOG_TAG} bonded devices refreshed count:`, list.length);
      return list;
    } catch (e: any) {
      console.warn(`${LOG_TAG} getBondedDevices error:`, e.message);
      return [];
    }
  }

  // Alias for getBondedDevices for backwards compatibility
  async getPairedDevices(): Promise<PrinterDevice[]> {
    return this.getBondedDevices();
  }

  async getConnectedDevices(): Promise<PrinterDevice[]> {
    try {
      if (!RNBluetoothClassic || typeof (RNBluetoothClassic as any).getConnectedDevices !== 'function') {
        return [];
      }
      const rawDevices = await RNBluetoothClassic.getConnectedDevices();
      return (rawDevices || []).map((d: any) => {
        const dev = this.normalizeNativeDevice(d, true);
        dev.connected = true;
        return dev;
      });
    } catch {
      return [];
    }
  }

  async startDiscovery(onDeviceFound?: (device: PrinterDevice) => void): Promise<PrinterDevice[]> {
    if (this.isScanning) {
      console.log(`${LOG_TAG} discovery already in progress`);
      return [];
    }
    this.isScanning = true;
    console.log(`${LOG_TAG} starting discovery`);
    try {
      const devices = await RNBluetoothClassic.startDiscovery();
      const normalized = (devices || []).map(d => {
        const dev = this.normalizeNativeDevice(d, false);
        if (onDeviceFound) onDeviceFound(dev);
        return dev;
      });
      return normalized;
    } catch (e: any) {
      console.warn(`${LOG_TAG} discovery error:`, e.message);
      throw new PrinterError('DEVICE_NOT_FOUND', e.message);
    } finally {
      this.isScanning = false;
    }
  }

  async scanDevices(onDeviceFound: (device: PrinterDevice) => void): Promise<void> {
    await this.startDiscovery(onDeviceFound);
  }

  async stopScan(): Promise<void> {
    return this.cancelDiscovery();
  }

  async cancelDiscovery(): Promise<void> {
    try {
      this.isScanning = false;
      if (RNBluetoothClassic && typeof (RNBluetoothClassic as any).cancelDiscovery === 'function') {
        await RNBluetoothClassic.cancelDiscovery();
        console.log(`${LOG_TAG} discovery cancelled`);
      }
    } catch (e) {}
  }

  async pairDevice(address: string): Promise<boolean> {
    try {
      if (RNBluetoothClassic && typeof (RNBluetoothClassic as any).pairDevice === 'function') {
        await RNBluetoothClassic.pairDevice(address);
        return true;
      }
      return true;
    } catch {
      return false;
    }
  }

  async connect(address: string): Promise<boolean> {
    const cleanAddress = address.toUpperCase().trim();
    console.log(`${LOG_TAG} RFCOMM connect start -> ${cleanAddress}`);

    if (this.isScanning) {
      await this.cancelDiscovery();
    }

    // Check if already connected to this address
    const currentlyConnected = await this.isDeviceConnected(cleanAddress);
    if (currentlyConnected) {
      console.log(`${LOG_TAG} already connected to ${cleanAddress}`);
      this.connectedDeviceAddress = cleanAddress;
      return true;
    }

    // Disconnect any different device before connecting
    if (this.connectedDeviceAddress && this.connectedDeviceAddress !== cleanAddress) {
      console.log(`${LOG_TAG} disconnecting previous device ${this.connectedDeviceAddress} before connecting to new device`);
      await this.disconnect(this.connectedDeviceAddress);
    }

    try {
      // Connect with a 12 second timeout protection
      const connectPromise = RNBluetoothClassic.connectToDevice(cleanAddress);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new PrinterError('CONNECTION_TIMEOUT', 'Connection timed out after 12s.')), 12000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      console.log(`${LOG_TAG} RFCOMM connect returned for ${cleanAddress}`);

      // Verify connection strictly with isDeviceConnected
      const verified = await this.isDeviceConnected(cleanAddress);
      console.log(`${LOG_TAG} connection verified:`, verified);
      if (verified) {
        this.connectedDeviceAddress = cleanAddress;
        return true;
      } else {
        throw new PrinterError('CONNECTION_FAILED', 'Connection could not be verified on socket.');
      }
    } catch (e: any) {
      console.warn(`${LOG_TAG} RFCOMM connect failed:`, e.message);
      // Double check if socket actually succeeded despite promise error
      const verified = await this.isDeviceConnected(cleanAddress);
      if (verified) {
        console.log(`${LOG_TAG} connection verified despite exception:`, cleanAddress);
        this.connectedDeviceAddress = cleanAddress;
        return true;
      }
      if (e instanceof PrinterError) throw e;
      throw new PrinterError('CONNECTION_FAILED', e.message || 'Connection failed.');
    }
  }

  async disconnect(address?: string): Promise<void> {
    const target = (address || this.connectedDeviceAddress || '').toUpperCase().trim();
    if (!target) return;

    console.log(`${LOG_TAG} RFCOMM disconnect start -> ${target}`);
    try {
      if (RNBluetoothClassic && typeof (RNBluetoothClassic as any).disconnectFromDevice === 'function') {
        await RNBluetoothClassic.disconnectFromDevice(target);
      }
    } catch (e: any) {
      console.warn(`${LOG_TAG} disconnectFromDevice warning:`, e.message);
    }

    if (!address || address.toUpperCase().trim() === (this.connectedDeviceAddress || '').toUpperCase().trim()) {
      this.connectedDeviceAddress = null;
    }
    console.log(`${LOG_TAG} RFCOMM disconnect completed for ${target}`);
  }

  async isDeviceConnected(address: string): Promise<boolean> {
    if (!address || !RNBluetoothClassic) return false;
    const clean = address.toUpperCase().trim();
    try {
      if (typeof (RNBluetoothClassic as any).isDeviceConnected === 'function') {
        const isConn = await RNBluetoothClassic.isDeviceConnected(clean);
        if (isConn) return true;
      }
      if (typeof (RNBluetoothClassic as any).getConnectedDevices === 'function') {
        const connectedList = await RNBluetoothClassic.getConnectedDevices();
        return (connectedList || []).some((d: any) => {
          const addr = (d.address || d.id || '').toUpperCase().trim();
          return addr === clean;
        });
      }
      return false;
    } catch {
      return false;
    }
  }

  async isConnected(address?: string): Promise<boolean> {
    const target = address || this.connectedDeviceAddress;
    if (!target) return false;
    const isConn = await this.isDeviceConnected(target);
    if (!isConn && target === this.connectedDeviceAddress) {
      this.connectedDeviceAddress = null;
    }
    return isConn;
  }

  async write(address: string, payload: Uint8Array | string): Promise<boolean> {
    const target = (address || this.connectedDeviceAddress || '').toUpperCase().trim();
    if (!target) {
      throw new PrinterError('CONNECTION_LOST', 'No printer address provided for write.');
    }

    console.log(`${LOG_TAG} write start -> ${target}`);
    const isConn = await this.isDeviceConnected(target);
    if (!isConn) {
      this.connectedDeviceAddress = null;
      throw new PrinterError('CONNECTION_LOST', 'Printer socket is not connected.');
    }

    try {
      let base64Data: string;
      if (typeof payload === 'string') {
        base64Data = btoa(payload);
      } else {
        base64Data = btoa(String.fromCharCode.apply(null, Array.from(payload)));
      }
      const success = await RNBluetoothClassic.writeToDevice(target, base64Data, 'base64');
      console.log(`${LOG_TAG} write success -> ${target}`);
      return Boolean(success);
    } catch (e: any) {
      console.warn(`${LOG_TAG} write failed:`, e.message);
      throw new PrinterError('WRITE_FAILED', e.message || 'Failed to write data to printer.');
    }
  }

  subscribeToAdapterEvents(onEnabled: () => void, onDisabled: () => void): () => void {
    const subEnabled = (state: 'ON' | 'OFF') => {
      if (state === 'ON') onEnabled();
      else onDisabled();
    };
    this.stateChangeCallbacks.push(subEnabled);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== subEnabled);
    };
  }

  subscribeToConnectionEvents(
    onConnected: (device: PrinterDevice) => void,
    onDisconnected: (address: string) => void
  ): () => void {
    const connCb = (device: PrinterDevice) => onConnected(device);
    const disconnCb = () => {
      if (this.connectedDeviceAddress) onDisconnected(this.connectedDeviceAddress);
    };
    this.deviceConnectedCallbacks.push(connCb);
    this.connectionLostCallbacks.push(disconnCb);
    return () => {
      this.deviceConnectedCallbacks = this.deviceConnectedCallbacks.filter(cb => cb !== connCb);
      this.connectionLostCallbacks = this.connectionLostCallbacks.filter(cb => cb !== disconnCb);
    };
  }

  onConnectionLost(callback: () => void): () => void {
    this.connectionLostCallbacks.push(callback);
    return () => {
      this.connectionLostCallbacks = this.connectionLostCallbacks.filter(cb => cb !== callback);
    };
  }

  onBluetoothStateChanged(callback: (state: 'ON' | 'OFF') => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  onDeviceConnected(callback: (device: PrinterDevice) => void): () => void {
    this.deviceConnectedCallbacks.push(callback);
    return () => {
      this.deviceConnectedCallbacks = this.deviceConnectedCallbacks.filter(cb => cb !== callback);
    };
  }

  async printTest(capabilities: PrinterCapabilities, businessName?: string, footer?: string): Promise<boolean> {
    if (!this.connectedDeviceAddress) {
      throw new PrinterError('CONNECTION_LOST', 'Printer is not connected.');
    }

    const data = buildTestPrintBytes(businessName, capabilities.paperWidth, Boolean(capabilities.supportsCutter), footer);
    return this.write(this.connectedDeviceAddress, data);
  }

  async printReceipt(order: any, capabilities: PrinterCapabilities): Promise<boolean> {
    if (!this.connectedDeviceAddress) {
      throw new PrinterError('CONNECTION_LOST', 'Printer is not connected.');
    }

    const data = buildReceiptBytes(order, capabilities.paperWidth, Boolean(capabilities.supportsCutter));
    return this.write(this.connectedDeviceAddress, data);
  }
}
