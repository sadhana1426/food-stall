import { create } from 'zustand';

interface CurrentOrderState {
  currentOrder: any | null;
  setCurrentOrder: (order: any) => void;
  clearCurrentOrder: () => void;
}

export const useCurrentOrderStore = create<CurrentOrderState>((set) => ({
  currentOrder: null,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  clearCurrentOrder: () => set({ currentOrder: null }),
}));
