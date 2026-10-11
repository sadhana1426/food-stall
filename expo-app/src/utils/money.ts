/**
 * Formats an integer paise value to a rupee string.
 * Example: 1500 -> '15', 1550 -> '15.50'
 */
export const formatMoney = (paise: number): string => {
  const rupees = Math.floor(paise / 100);
  const paiseRemainder = Math.round(paise % 100);
  
  if (paiseRemainder === 0) {
    return `${rupees}`;
  }
  
  return `${rupees}.${paiseRemainder.toString().padStart(2, '0')}`;
};

/**
 * Parses a rupee string into an integer paise value.
 * Example: '15' -> 1500, '15.5' -> 1550
 */
export const parseMoney = (rupeeString: string): number => {
  const parsed = parseFloat(rupeeString);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

export const calculateLineTotal = (pricePaise: number, quantity: number): number => {
  return pricePaise * quantity;
};

export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export const calculateDiscount = (
  subtotalPaise: number, 
  discountType: DiscountType | 'None' | 'Percentage' | 'Fixed', 
  discountValue: number
): number => {
  if (discountType === 'NONE' || discountType === 'None') return 0;
  if (discountType === 'PERCENTAGE' || discountType === 'Percentage') {
    return Math.round(subtotalPaise * (discountValue / 100));
  }
  if (discountType === 'FIXED' || discountType === 'Fixed') {
    return Math.min(subtotalPaise, Math.round(discountValue * 100));
  }
  return 0;
};

export const calculateTax = (taxableAmountPaise: number, taxRate: number, isEnabled: boolean): number => {
  if (!isEnabled) return 0;
  return Math.round(taxableAmountPaise * (taxRate / 100));
};
