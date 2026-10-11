export type PrinterErrorCode =
  | 'PERMISSION_DENIED'
  | 'BLUETOOTH_OFF'
  | 'DEVICE_NOT_FOUND'
  | 'PAIRING_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'WRITE_FAILED'
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
