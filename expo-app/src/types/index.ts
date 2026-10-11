export type MenuImage = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
};

export interface MenuItem {
  id: string;
  _id?: string;
  name: string;
  pricePaise: number;
  category: string;
  isAvailable: boolean;
  image?: MenuImage | null;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderType = 'Dine In' | 'Takeaway';

export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export interface OrderItemSnapshot {
  menuItemId: string;
  name: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface Order {
  id: string;
  _id?: string;
  billNumber: string;
  orderType: OrderType;
  items: OrderItemSnapshot[];
  subtotalPaise: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmountPaise: number;
  taxRate: number;
  taxAmountPaise: number;
  grandTotalPaise: number;
  createdAt: string; // ISO string
  printCount: number;
}

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  receiptFooter: string;
  adminPassword?: string;
  securityQuestions?: SecurityQuestion[];
}

export interface TaxSettings {
  isEnabled: boolean;
  rate: number; // percentage
}

export interface PrinterDevice {
  id: string;
  name: string;
}

export type PrinterStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'PRINTING' | 'SUCCESS' | 'ERROR';

export interface PrinterSettings {
  printerId: string | null;
  paperWidth: '58mm' | '80mm';
  autoPrint: boolean;
  simulateFailure: boolean;
}
