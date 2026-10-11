import { create } from 'zustand';
import { BusinessSettings, TaxSettings, PrinterSettings, OrderType } from '../types';

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: 'Tasty Bites',
  address: 'Food Street, Bengaluru',
  phone: '98765 43210',
  receiptFooter: 'Thank You! Visit Again.',
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  isEnabled: false,
  rate: 5,
};

interface SettingsState {
  business: BusinessSettings;
  tax: TaxSettings;
  defaultOrderType: OrderType;
  defaultDiscountPercent: number;
  
  updateBusiness: (updates: Partial<BusinessSettings>) => void;
  updateTax: (updates: Partial<TaxSettings>) => void;
  setDefaultOrderType: (type: OrderType) => void;
  setDefaultDiscountPercent: (percent: number) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  business: { ...DEFAULT_BUSINESS_SETTINGS },
  tax: { ...DEFAULT_TAX_SETTINGS },
  defaultOrderType: 'Dine In',
  defaultDiscountPercent: 0,
  
  updateBusiness: (updates) => set((state) => ({ business: { ...state.business, ...updates } })),
  updateTax: (updates) => set((state) => ({ tax: { ...state.tax, ...updates } })),
  setDefaultOrderType: (type) => set({ defaultOrderType: type }),
  setDefaultDiscountPercent: (percent) => set({ defaultDiscountPercent: percent }),
  
  resetSettings: () => set({
    business: { ...DEFAULT_BUSINESS_SETTINGS },
    tax: { ...DEFAULT_TAX_SETTINGS },
    defaultOrderType: 'Dine In',
    defaultDiscountPercent: 0,
  }),
}));
