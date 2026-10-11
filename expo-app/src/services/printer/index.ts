import { BluetoothPrinterService } from './BluetoothPrinterService';
import { MockPrinterService } from './MockPrinterService';
import { PrinterService } from './printerTypes';

// Provide a factory or singleton based on environment
const isDev = process.env.EXPO_PUBLIC_MOCK_PRINTER === 'true';

export const printerService: PrinterService = isDev 
  ? new MockPrinterService() 
  : new BluetoothPrinterService();

export * from './printerTypes';
export * from './printerErrors';
export * from './EscPosEncoder';
