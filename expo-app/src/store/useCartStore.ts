import { create } from 'zustand';
import { CartItem, MenuItem } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (menuItem: MenuItem) => void;
  decreaseQuantity: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  
  getTotalQuantity: () => number;
  getSubtotalPaise: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (menuItem) => set((state) => {
    const existing = state.items.find(i => i.menuItem.id === menuItem.id);
    if (existing) {
      return {
        items: state.items.map(i => 
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      };
    }
    return { items: [...state.items, { menuItem, quantity: 1 }] };
  }),
  
  decreaseQuantity: (menuItemId) => set((state) => {
    const existing = state.items.find(i => i.menuItem.id === menuItemId);
    if (existing && existing.quantity > 1) {
      return {
        items: state.items.map(i => 
          i.menuItem.id === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      };
    }
    return {
      items: state.items.filter(i => i.menuItem.id !== menuItemId)
    };
  }),
  
  removeItem: (menuItemId) => set((state) => ({
    items: state.items.filter(i => i.menuItem.id !== menuItemId)
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotalQuantity: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getSubtotalPaise: () => {
    return get().items.reduce((total, item) => total + (item.menuItem.pricePaise * item.quantity), 0);
  }
}));
