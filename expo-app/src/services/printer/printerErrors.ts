export type PrinterErrorCode =
  | 'PERMISSION_DENIED'
  | 'BLUETOOTH_OFF'
  | 'DEVICE_NOT_PAIRED'
  | 'DEVICE_NOT_FOUND'
  | 'PAIRING_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'WRITE_FAILED'
  | 'ALREADY_CONNECTING'
  | 'PRINTER_UNAVAILABLE'
  | 'UNSUPPORTED_DEVICE'
  | 'UNSUPPORTED_PROTOCOL'
  | 'PRINT_ENCODING_FAILED'
  | 'UNKNOWN';

export class PrinterError extends Error {
  code: PrinterErrorCode;
  constructor(code: PrinterErrorCode, message: string) {
    super(message);
    this.name = 'PrinterError';
    this.code = code;
  }
}

export function getUserFriendlyPrinterError(code: PrinterErrorCode | string, fallback?: string): string {
  switch (code) {
    case 'PERMISSION_DENIED':
      return 'Bluetooth permission was not granted. Please allow Nearby Devices permission in phone settings.';
    case 'BLUETOOTH_OFF':
      return 'Bluetooth is turned off. Please turn on Bluetooth to connect your printer.';
    case 'DEVICE_NOT_PAIRED':
      return 'Printer is not paired with this phone. Please pair it in Android Bluetooth settings first.';
    case 'DEVICE_NOT_FOUND':
      return 'Printer not found. Please ensure it is powered on and within Bluetooth range.';
    case 'CONNECTION_TIMEOUT':
      return 'Connection timed out. Please check that the printer is turned on and ready.';
    case 'CONNECTION_FAILED':
      return 'Unable to establish connection with printer. Please ensure it is powered on and not in use by another app.';
    case 'CONNECTION_LOST':
      return 'Connection to the printer was lost. Please reconnect.';
    case 'WRITE_FAILED':
      return 'Failed to send print command to printer. Please check paper and connection.';
    case 'ALREADY_CONNECTING':
      return 'Connection attempt already in progress.';
    case 'PRINTER_UNAVAILABLE':
      return 'Printer is currently unavailable.';
    default:
      return fallback || 'A printer error occurred. Please try again.';
  }
}
