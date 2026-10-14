import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { BluetoothPrinterService } from './BluetoothPrinterService';
import { MockPrinterService } from './MockPrinterService';
import { PrinterService } from './printerTypes';

const hasBluetoothNativeModule = !!(
  RNBluetoothClassic &&
  typeof (RNBluetoothClassic as any).isBluetoothEnabled === 'function'
);

// In release builds, NEVER fall back to mock printer. Real Bluetooth Classic is strictly used.
const useMock = __DEV__ && process.env.EXPO_PUBLIC_MOCK_PRINTER === 'true' && !hasBluetoothNativeModule;

export const printerService: PrinterService = useMock 
  ? new MockPrinterService() 
  : new BluetoothPrinterService();

export * from './printerTypes';
export * from './printerErrors';
export * from './EscPosEncoder';
